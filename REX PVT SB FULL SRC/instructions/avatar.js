module.exports = {
  name: 'avatar',
  async execute(message, args, config) {
    const user = args.length ? await message.client.users.fetch(args[0].replace(/[^0-9]/g, '')) : message.author;
    if (!user) return message.channel.send('❕ USER NOT FOUND.');

    message.channel.send(`🖼 AVATAR: ${user.displayAvatarURL({ dynamic: true, size: 2048 })}`);
  }
};
