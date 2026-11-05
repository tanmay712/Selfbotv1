const { box } = require('../../src/ui');

module.exports = {
  name: 'prefix',
  description: 'Change command prefix.',
  category: 'utility',
  usage: '<new prefix>',
  async execute(message, args, { config }) {
    if (!args[0]) return message.channel.send(box('PREFIX', ['provide a new prefix.']));
    const cfg = config.update({ prefix: args[0] });
    return message.channel.send(box('PREFIX', [`prefix set to ${cfg.prefix}`]));
  },
};
