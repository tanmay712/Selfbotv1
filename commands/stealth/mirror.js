// [MIRROR] Repeat everything a target user says (in same channel, or DMs)
const config = require('../../src/config');
const { box } = require('../../src/ui');

const mirrorState = { enabled: false, targetId: null };

module.exports = {
  name: 'mirror',
  description: 'Auto-repeat every message a target user sends.',
  category: 'stealth',
  usage: '<on|off> <user>',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'off' || sub === 'stop') {
      mirrorState.enabled = false; mirrorState.targetId = null;
      return message.channel.send(box('MIRROR', ['disabled.']));
    }
    const id = args.slice(1).join(' ').replace(/\D/g, '') || message.mentions.users.first()?.id;
    if (!id) return message.channel.send(box('MIRROR', ['usage: ;mirror on <user>']));
    mirrorState.enabled = true; mirrorState.targetId = id;
    return message.channel.send(box('MIRROR', [`now mirroring <@${id}>`]));
  },
  async _hook(msg) {
    if (!mirrorState.enabled || !mirrorState.targetId) return;
    if (msg.author.id !== mirrorState.targetId) return;
    if (msg.author.id === msg.client.user.id) return;
    if (msg.content && !msg.content.startsWith(require('../../src/config').get().prefix)) {
      await msg.channel.send(msg.content).catch(() => {});
    }
  },
};
