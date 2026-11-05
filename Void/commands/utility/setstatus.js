const { box } = require('../../src/ui');

module.exports = {
  name: 'setstatus',
  aliases: ['status'],
  description: 'Set Discord status.',
  category: 'utility',
  usage: '<online|idle|dnd|invisible>',
  async execute(message, args, { client, config }) {
    const s = (args[0] || 'idle').toLowerCase();
    if (!['online', 'idle', 'dnd', 'invisible'].includes(s))
      return message.channel.send(box('STATUS', ['invalid. use: online | idle | dnd | invisible']));
    client.user.setStatus(s);
    config.update({ status: s });
    return message.channel.send(box('STATUS', [`status set to ${s}`]));
  },
};
