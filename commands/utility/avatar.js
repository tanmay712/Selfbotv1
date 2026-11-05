const { box } = require('../../src/ui');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  description: "Get a user's avatar URL.",
  category: 'utility',
  usage: '[user]',
  async execute(message, args, { client }) {
    const id = (args[0] || message.author.id).replace(/\D/g, '') || message.author.id;
    const user = await client.users.fetch(id).catch(() => null);
    if (!user) return message.channel.send(box('AVATAR', ['user not found.']));
    return message.channel.send(`[AVATAR] ${user.tag}\n${user.displayAvatarURL({ dynamic: true, size: 4096 })}`);
  },
};
