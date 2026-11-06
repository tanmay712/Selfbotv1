// [MODLOGS] Log server events (joins/leaves/edits/deletes) to a channel.
const { box, kvBox } = require('../../src/ui');
const gcfg = require('../../src/guild-cfg');

const DEFAULTS = {
  enabled: false,
  channelId: null,
  events: { join: true, leave: true, edit: false, delete: true, ban: true },
};

module.exports = {
  name: 'modlogs',
  aliases: ['logs', 'log', 'ml'],
  description: 'Log member joins/leaves/message edits/deletes/bans to a channel.',
  category: 'server',
  usage: '<on|off|channel <#ch>|event <name> <on|off>|status>',
  _needsInit: true,
  init(client) {
    function cfg(gid) { return { ...DEFAULTS, ...(gcfg.get(gid, 'modlogs', {})) }; }
    function post(g, lines) {
      const c = cfg(g.id);
      if (!c.enabled || !c.channelId) return;
      const ch = g.channels.cache.get(c.channelId);
      if (!ch) return;
      ch.send('```ini\n' + lines.map(l=>l.replace(/```/g,'')).join('\n') + '\n```').catch(()=>{});
    }
    client.on('guildMemberAdd',    m => { if (cfg(m.guild.id).events.join)   post(m.guild, [`[+JOIN  ] ${m.user.tag} (${m.user.id})`]); });
    client.on('guildMemberRemove', m => { if (cfg(m.guild.id).events.leave)  post(m.guild, [`[-LEAVE ] ${m.user?.tag||'unknown'} (${m.user?.id||m.id})`]); });
    client.on('guildBanAdd',       b => { if (cfg(b.guild.id).events.ban)    post(b.guild, [`[!BAN   ] ${b.user?.tag||'unknown'}`]); });
    client.on('messageDelete',     m => {
      if (!m.guild || !cfg(m.guild.id).events.delete) return;
      if (m.author?.bot) return;
      const snippet = (m.content||'').slice(0,200).replace(/\n/g,' ');
      post(m.guild, [`[!DEL   ] #${m.channel.name} | ${m.author?.tag||'?'}: ${snippet}`]);
    });
    client.on('messageUpdate', (o,m) => {
      if (!m.guild?.id || !cfg(m.guild.id).events.edit) return;
      if (m.author?.bot) return;
      if ((o.content||'') === (m.content||'')) return;
      post(m.guild, [`[*EDIT  ] #${m.channel.name} | ${m.author?.tag||'?'}`, `  from: ${(o.content||'').slice(0,160).replace(/\n/g,' ')}`, `  to  : ${(m.content||'').slice(0,160).replace(/\n/g,' ')}`]);
    });
  },
  async execute(message, args) {
    if (!message.guild) return;
    const gid = message.guild.id;
    const sub = (args[0] || 'status').toLowerCase();
    const cur = { ...DEFAULTS, ...(gcfg.get(gid, 'modlogs', {})) };

    if (sub === 'on')  { gcfg.set(gid,'modlogs',{...cur,enabled:true}); return message.channel.send(box('MODLOGS',['enabled.'])); }
    if (sub === 'off') { gcfg.set(gid,'modlogs',{...cur,enabled:false}); return message.channel.send(box('MODLOGS',['disabled.'])); }
    if (sub === 'channel' || sub === 'ch') {
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!ch) return message.channel.send(box('MODLOGS', ['mention a channel.']));
      gcfg.set(gid,'modlogs',{...cur,channelId:ch.id,enabled:true});
      return message.channel.send(box('MODLOGS',[`logs -> #${ch.name}`]));
    }
    if (sub === 'event' || sub === 'evt') {
      const evt = (args[1]||'').toLowerCase();
      const on = args[2] && ['on','true','yes','1'].includes(args[2].toLowerCase());
      const off = args[2] && ['off','false','no','0'].includes(args[2].toLowerCase());
      const valid = Object.keys(DEFAULTS.events);
      if (!valid.includes(evt)) return message.channel.send(box('MODLOGS', ['events: '+valid.join(', ')]));
      cur.events = { ...cur.events, [evt]: on ? true : (off ? false : !cur.events[evt]) };
      gcfg.set(gid,'modlogs',cur);
      return message.channel.send(box('MODLOGS',[`${evt}: ${cur.events[evt]?'on':'off'}`]));
    }
    const ch = cur.channelId ? message.guild.channels.cache.get(cur.channelId) : null;
    return message.channel.send(kvBox('MODLOGS', [
      ['enabled', String(cur.enabled)],
      ['channel', ch ? '#'+ch.name : '(none)'],
      ['joins', yn(cur.events.join)],
      ['leaves', yn(cur.events.leave)],
      ['bans', yn(cur.events.ban)],
      ['deletes', yn(cur.events.delete)],
      ['edits', yn(cur.events.edit)],
    ]));
  },
};
function yn(b){return b?'on':'off';}
