module.exports = {
  name: 'prefix',
  description: 'Change command prefix.',
  category: 'utility',
  usage: '<new prefix>',
  async execute(message, args, { config }) {
    if (!args[0]) return message.channel.send('⬛ Provide a new prefix.');
    const cfg = config.update({ prefix: args[0] });
    message.channel.send(`⬛ Prefix set to \`${cfg.prefix}\``);
  },
};
