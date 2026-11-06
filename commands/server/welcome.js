// [WELCOME] Send a customizable welcome DM + channel message when a member joins.
const { box, kvBox } = require('../../src/ui');
const gcfg = require('../../src/guild-cfg');

const DEFAULTS = {
  enabled: false,
  channelId: null,    // channel to post in
  dm: false,          // also DM the new member
  text: 'welcome {user} to {server}!',
};

module.exports = {
  name: 'welcome',
  aliases: ['welcomer', 'greet'],
  description: 'Send welcome messages when members join.',
  category: 'server',
  usage: '<on|off|channel <#ch>|dm <on|off>|text <msg>|status>',
  _needsInit: true,
  init(client) {
    client.on('guildMemberAdd', async (member) => {
      const gid = member.guild.id;
      const cfg = { ...DEFAULTS, ...(gcfg.get(gid, 'welcome', {})) };
      if (!cfg.enabled) return;
      const vars = {
        '{user}': member.toString(),
        '{user.tag}': member.user.tag,
        '{user.id}': member.user.id,
        '{server}': member.guild.name,
        '{mention}': member.toString(),
        '{count}': member.guild.memberCount,
      };
      const fill = s => Object.keys(vars).reduce((acc,k)=>acc.split(k).join(vars[k]), s || '');
      const text = fill(cfg.text);
      try {
        if (cfg.channelId) {
          const ch = member.guild.channels.cache.get(cfg.channelId);
          if (ch) await ch.send(text).catch(()=>{});
        }
      } catch (_) {}
      try {
        if (cfg.dm) await member.send(text).catch(()=>{});
      } catch (_) {}
    });
  },
  async execute(message, args) {
    if (!message.guild) return;
    const gid = message.guild.id;
    const sub = (args[0] || 'status').toLowerCase();
    const cur = { ...DEFAULTS, ...(gcfg.get(gid, 'welcome', {})) };

    if (sub === 'on') {
      gcfg.set(gid, 'welcome', { ...cur, enabled: true });
      return message.channel.send(box('WELCOME', ['enabled.']));
    }
    if (sub === 'off') {
      gcfg.set(gid, 'welcome', { ...cur, enabled: false });
      return message.channel.send(box('WELCOME', ['disabled.']));
    }
    if (sub === 'channel' || sub === 'ch') {
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!ch) return message.channel.send(box('WELCOME', ['mention a channel or pass an id.']));
      gcfg.set(gid, 'welcome', { ...cur, channelId: ch.id, enabled: true });
      return message.channel.send(box('WELCOME', [`welcome messages -> #${ch.name}`]));
    }
    if (sub === 'dm') {
      const on = args[1] && ['on','true','yes','1'].includes(args[1].toLowerCase());
      gcfg.set(gid, 'welcome', { ...cur, dm: on });
      return message.channel.send(box('WELCOME', [`DM new members: ${on ? 'on' : 'off'}`]));
    }
    if (sub === 'text' || sub === 'msg' || sub === 'message') {
      const text = args.slice(1).join(' ');
      if (!text) return message.channel.send(box('WELCOME', ['usage: ;welcome text <message>\\n  vars: {user} {user.tag} {server} {count}']));
      gcfg.set(gid, 'welcome', { ...cur, text });
      return message.channel.send(box('WELCOME', ['message set. preview:', text.replace('{user}', message.member.toString()).replace('{user.tag}', message.author.tag).replace('{server}', message.guild.name).replace('{count}', message.guild.memberCount)]));
    }
    const ch = cur.channelId ? message.guild.channels.cache.get(cur.channelId) : null;
    return message.channel.send(kvBox('WELCOME', [
      ['enabled', String(cur.enabled)],
      ['channel', ch ? '#'+ch.name : '(none)'],
      ['dm', String(cur.dm)],
      ['text', cur.text.length > 60 ? cur.text.slice(0,60)+'...' : cur.text],
    ]));
  },
};
