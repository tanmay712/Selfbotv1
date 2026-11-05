// [DASHBOARD-RELAY] bridges relay messages (from hosted Vercel site) to the local client.
// Handles /api/state, /api/logs, /api/exec, /api/rpc as if they were local HTTP calls.
const log = require('./logger');
const rl  = require('./protection/ratelimit');

function buildState(client) {
  if (!client || !client.user) return { ready:false, config: require('./config').get(), time:Date.now() };
  const guilds = [...client.guilds.cache.values()].map(g=>({
    id:g.id, name:g.name, icon: g.iconURL ? g.iconURL({dynamic:true}) : null,
    members:g.memberCount, channels:g.channels?.cache?.size ?? 0
  }));
  return {
    ready:true,
    user:{ tag:client.user.tag, id:client.user.id, avatar:client.user.displayAvatarURL({dynamic:true}), status: client.user.presence?.status },
    rpc: require('./rpc').getState(),
    config: require('./config').get(),
    guilds,
    textChannels: guilds.flatMap(g => {
      const gg = client.guilds.cache.get(g.id); if (!gg) return [];
      return [...gg.channels.cache.values()].filter(c=>c.type==='GUILD_TEXT').slice(0,60).map(c=>({id:c.id,name:c.name,guild:g.name,guildId:g.id}));
    }),
    stats:{
      uptime: client.uptime, ping: client.ws.ping,
      guilds: client.guilds.cache.size, channels: client.channels.cache.size,
      mem: Math.round(process.memoryUsage().heapUsed/1024/1024),
    },
    time: Date.now(),
  };
}

// Synthetic message factory for executing commands via exec
function synthMessage(client, channel, content) {
  return {
    author: { id: client.user.id },
    content, channel, guild: channel.guild || null,
    mentions: { users: new Map(), channels: new Map(), has: (id)=>false },
    delete: async ()=>{},
    reply: async (t)=>channel.send(t),
    edit:  async (t)=>channel.send(t),
    client,
  };
}

async function dispatch(client, commands, msg) {
  const { path, method, data } = msg;
  const log = require('./logger');
  const config = require('./config');
  try {
    if (path === '/api/state') return buildState(client);
    if (path === '/api/logs') return log.ring();
    if (path === '/api/exec' && method==='POST') {
      const { action, payload } = data || {};
      if (action === 'prefix') { config.update({ prefix: payload.prefix || ';' }); return { ok:true, prefix:config.get().prefix }; }
      if (action === 'status') {
        if (['online','idle','dnd','invisible'].includes(payload.status)) client.user.setStatus(payload.status);
        config.update({ status: payload.status });
        return { ok:true };
      }
      if (action === 'activity') {
        const types = { PLAYING:0, STREAMING:1, LISTENING:2, WATCHING:3, COMPETING:5 };
        const t = (payload.type||'PLAYING').toUpperCase();
        if (types[t]!==undefined) {
          const opts={type:types[t]};
          if (t==='STREAMING') opts.url='https://twitch.tv/void';
          client.user.setActivity(payload.text||'VOID', opts);
        }
        return { ok:true };
      }
      if (action === 'stopactivity') { client.user.setActivity(null); return { ok:true }; }
      if (action === 'nick') {
        const g = client.guilds.cache.get(payload.guild);
        if (g) await g.members.cache.get(client.user.id)?.setNickname(payload.nick||'').catch(()=>{});
        return { ok:true };
      }
      return { error:'unknown action' };
    }
    if (path === '/api/rpc' && method==='POST') {
      const rpc = require('./rpc');
      const cfg = config.get();
      const b = data || {};
      if (b.action==='connect') { config.update({rpc:{...cfg.rpc,enabled:true,clientId:b.clientId||cfg.rpc.clientId}}); rpc.connect(config.get().rpc.clientId); return {ok:true,rpc:rpc.getState()}; }
      if (b.action==='disconnect') { rpc.disconnect(); config.update({rpc:{...cfg.rpc,enabled:false}}); return {ok:true,rpc:rpc.getState()}; }
      if (b.action==='set') { const patch={...cfg.rpc,...b.fields}; config.update({rpc:patch}); rpc.setActivity({...patch,startTimestamp:Date.now()}); return {ok:true,rpc:rpc.getState()}; }
      if (b.action==='clear') { rpc.clearActivity(); return {ok:true}; }
    }
    // Direct exec (run a selfbot command in a channel)
    if (path === '/api/exec' && data && data.channel && data.text) {
      const ch = client.channels.cache.get(data.channel);
      if (!ch) return { error:'channel not found' };
      const fake = synthMessage(client, ch, data.text);
      client.emit('messageCreate', fake);
      return { ok:true, queued:true };
    }
    return { error:'unknown path' };
  } catch(e) { return { error: e.message }; }
}

function attach(client, commands, relay) {
  relay.onmessage = async (msg) => {
    return await dispatch(client, commands, msg);
  };
}

module.exports = { attach, buildState, dispatch };
