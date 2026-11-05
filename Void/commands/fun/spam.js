const { box } = require('../../src/ui');
const active = new Map();

module.exports = {
  name: 'spam',
  description: 'Spam a message in a channel.',
  category: 'fun',
  usage: '<count> <message> | stop',
  async execute(message, args) {
    if (args[0] === 'stop') { active.set(message.channel.id, false); return message.channel.send(box('SPAM', ['stopped.'])); }
    const n = parseInt(args[0]);
    if (!n || n < 1 || n > 100) return message.channel.send(box('SPAM', ['count must be 1-100.']));
    const text = args.slice(1).join(' ') || 'VOID';
    active.set(message.channel.id, true);
    await message.delete().catch(() => {});
    for (let i = 0; i < n; i++) {
      if (!active.get(message.channel.id)) break;
      await message.channel.send(text).catch(() => {});
      await new Promise(r => setTimeout(r, 350));
    }
    active.delete(message.channel.id);
  },
};
