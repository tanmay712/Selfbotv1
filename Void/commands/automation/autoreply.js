const config = require('../../src/config');
const { box } = require('../../src/ui');

module.exports = {
  name: 'autoreply',
  description: 'Auto-reply to DMs and mentions.',
  category: 'automation',
  usage: '<on|off|set <message>|status>',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    const ar = config.get().autoReply;
    if (sub === 'on') { config.update({ autoReply: { ...ar, enabled: true } }); return message.channel.send(box('AUTOREPLY', ['on.'])); }
    if (sub === 'off') { config.update({ autoReply: { ...ar, enabled: false } }); return message.channel.send(box('AUTOREPLY', ['off.'])); }
    if (sub === 'set') {
      const text = args.slice(1).join(' ');
      if (!text) return message.channel.send(box('AUTOREPLY', ['provide a message.']));
      config.update({ autoReply: { ...ar, message: text } });
      return message.channel.send(box('AUTOREPLY', ['message set.']));
    }
    return message.channel.send(box('AUTOREPLY', [
      `state: ${ar.enabled ? 'ON' : 'OFF'}`,
      `message: ${ar.message}`,
    ]));
  },
  async _hook(msg) {
    const ar = config.get().autoReply;
    if (!ar.enabled) return;
    if (msg.author.id === msg.client.user.id) return;
    const dm = ar.dms && msg.channel.type === 'DM';
    const mention = ar.mentions && msg.mentions.has(msg.client.user.id);
    if (dm || mention) msg.reply(ar.message).catch(() => {});
  },
};
