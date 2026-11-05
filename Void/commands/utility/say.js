module.exports = {
  name: 'say',
  aliases: ['echo'],
  description: 'Make self say something (deletes trigger).',
  category: 'utility',
  usage: '<message>',
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return;
    await message.delete().catch(() => {});
    return message.channel.send(text);
  },
};
