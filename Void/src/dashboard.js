// ⬛ VOID Dashboard — Express + WebSocket live dashboard with RPC controls, status, logs, etc.
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');
const log = require('./logger');
const rpc = require('./rpc');
const config = require('./config');

function start(client) {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Simple password gate (basic) — password sent via ?pw= query OR ws header
  function authorized(req) {
    const pw = process.env.DASH_PASSWORD || 'void';
    if (pw === 'none') return true;
    const fromQ = (req.query && req.query.pw) || '';
    const fromH = req.headers['x-void-pw'] || '';
    return fromQ === pw || fromH === pw;
  }

  app.get('/api/state', (req,res)=>{
    if (!authorized(req)) return res.status(401).json({ error:'unauthorized' });
    res.json(buildState(client));
  });

  app.post('/api/exec', async (req,res)=>{
    if (!authorized(req)) return res.status(401).json({ error:'unauthorized' });
    const { action, payload } = req.body || {};
    const result = await applyAction(client, action, payload);
    res.json({ ok:true, result });
    broadcast({ type:'state', state: buildState(client) });
  });

  app.post('/api/rpc', (req,res)=>{
    if (!authorized(req)) return res.status(401).json({ error:'unauthorized' });
    const body = req.body || {};
    if (body.action === 'connect') {
      config.update({ rpc: { ...config.get().rpc, enabled: true, clientId: body.clientId || config.get().rpc.clientId }});
      rpc.connect(config.get().rpc.clientId);
    } else if (body.action === 'disconnect') {
      rpc.disconnect();
      config.update({ rpc: { ...config.get().rpc, enabled: false }});
    } else if (body.action === 'set') {
      const patch = { ...config.get().rpc, ...body.fields };
      config.update({ rpc: patch });
      rpc.setActivity({ ...patch, startTimestamp: Date.now() });
    } else if (body.action === 'clear') {
      rpc.clearActivity();
    }
    res.json({ ok:true, rpc: rpc.getState(), config: config.get().rpc });
    broadcast({ type:'state', state: buildState(client) });
  });

  app.get('/api/logs', (req,res)=>{
    if (!authorized(req)) return res.status(401).json({ error:'unauthorized' });
    res.json(log.ring());
  });

  function broadcast(obj) {
    const data = JSON.stringify(obj);
    wss.clients.forEach(ws => { if (ws.isAlive && ws._authed) ws.send(data); });
  }

  // bridge logger to websocket
  log._broadcast = (entry) => broadcast({ type:'log', entry });

  wss.on('connection', (ws, req) => {
    const pw = process.env.DASH_PASSWORD || 'void';
    const url = new URL(req.url, 'http://x');
    const qp = url.searchParams.get('pw') || '';
    ws._authed = pw === 'none' || qp === pw;
    if (!ws._authed) { ws.close(4001, 'unauthorized'); return; }
    ws.isAlive = true;
    ws.on('pong', ()=>ws.isAlive=true);
    ws.send(JSON.stringify({ type:'state', state: buildState(client) }));
    ws.send(JSON.stringify({ type:'logs', logs: log.ring() }));
  });

  setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
    broadcast({ type:'state', state: buildState(client) });
  }, 4000);

  const port = parseInt(process.env.DASH_PORT) || 8484;
  server.listen(port, '0.0.0.0', () => {
    const localUrl = `http://${getLanIP()}:${port}/?pw=${encodeURIComponent(process.env.DASH_PASSWORD||'void')}`;
    log.dash('DASH', `Listening on ${localUrl}`);
    if (client && client.voidOnDashReady) client.voidOnDashReady(localUrl);
    if (process.env.DASH_AUTO_OPEN !== 'false') {
      try {
        const open = require('open');
        open(localUrl).catch(()=>{});
      } catch(_){}
    }
  });

  return { server, broadcast };
}

function getLanIP() {
  const ifaces = os.networkInterfaces();
  for (const ifn of Object.keys(ifaces)) {
    for (const addr of ifaces[ifn]) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return '127.0.0.1';
}

function buildState(client) {
  if (!client || !client.user) {
    return { ready:false, rpc: rpc.getState(), config: config.get(), guilds:[], stats:{ cpu:0, mem: process.memoryUsage().heapUsed }, time: Date.now() };
  }
  const guilds = [...client.guilds.cache.values()].map(g=>({
    id:g.id, name:g.name, icon: g.iconURL ? g.iconURL({ dynamic:true }) : null, members:g.memberCount, channels:g.channels?.cache?.size ?? 0
  }));
  return {
    ready: true,
    user: { tag: client.user.tag, id: client.user.id, avatar: client.user.displayAvatarURL({ dynamic:true }), status: client.user.presence?.status },
    rpc: rpc.getState(),
    config: config.get(),
    guilds,
    stats: {
      uptime: client.uptime,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      channels: client.channels.cache.size,
      mem: Math.round(process.memoryUsage().heapUsed/1024/1024),
    },
    time: Date.now(),
  };
}

async function applyAction(client, action, payload) {
  if (!client || !client.user) return { error:'not ready' };
  switch(action) {
    case 'status': {
      const s = payload.status;
      if (['online','idle','dnd','invisible'].includes(s)) client.user.setStatus(s);
      config.update({ status: s });
      return { status:s };
    }
    case 'activity': {
      const types = { PLAYING:0, STREAMING:1, LISTENING:2, WATCHING:3, COMPETING:5 };
      const t = (payload.type||'PLAYING').toUpperCase();
      if (types[t]===undefined) return { error:'bad type' };
      const opts = { type: types[t] };
      if (t==='STREAMING') opts.url='https://twitch.tv/void';
      client.user.setActivity(payload.text||'VOID', opts);
      return { ok:true };
    }
    case 'stopactivity': {
      client.user.setActivity(null);
      return { ok:true };
    }
    case 'nick': {
      // set nick in a guild (or global if possible)
      if (!payload.guild) return { error:'guild required' };
      const g = client.guilds.cache.get(payload.guild);
      if (g) { await g.members.cache.get(client.user.id)?.setNickname(payload.nick||'').catch(()=>{}); }
      return { ok:true };
    }
    case 'prefix': {
      config.update({ prefix: payload.prefix || ';' });
      return { prefix: config.get().prefix };
    }
  }
  return { error:'unknown action' };
}

module.exports = { start };
