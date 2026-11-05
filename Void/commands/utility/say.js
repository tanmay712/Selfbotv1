module.exports = {
  name: 'say',
  aliases: ['echo'],
  description: 'Make the bot say something (deletes your trigger).',
  category: 'utility',
  usage: '<message>',
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return;
    await message.delete().catch(()=>{});
    message.channel.send(text);
  },
};
