// [GHOSTTYPE] Permanent typing indicator in a channel
const config = require('../../src/config');
const { box } = require('../../src/ui');
const typingTimers = new Map(); // chId -> intervalHandle

module.exports = {
  name: 'ghosttype',
  description: 'Permanent "typing..." indicator in a channel.',
  category: 'stealth',
  usage: '<on|off> [channel]',
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    const sub = (args[0] || 'on').toLowerCase();
    if (sub === 'off' || sub === 'stop') {
      clearInterval(typingTimers.get(ch.id));
      typingTimers.delete(ch.id);
      return message.channel.send(box('GHOSTTYPE', ['stopped.']));
    }
    if (typingTimers.has(ch.id)) return message.channel.send(box('GHOSTTYPE', ['already running here.']));
    ch.sendTyping().catch(() => {});
    const iv = setInterval(() => ch.sendTyping().catch(() => {}), 8000);
    typingTimers.set(ch.id, iv);
    return message.channel.send(box('GHOSTTYPE', ['typing forever...']));
  },
};
