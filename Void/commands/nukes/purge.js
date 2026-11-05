module.exports = {
  name: 'purge',
  aliases: ['prune','clear'],
  description: 'Delete recent messages in this channel (up to 100).',
  category: 'nukes',
  usage: '<count>',
  async execute(message, args) {
    const n = Math.min(parseInt(args[0])||20, 100);
    await message.delete().catch(()=>{});
    const msgs = await message.channel.messages.fetch({ limit:n });
    await message.channel.bulkDelete(msgs, true).catch(()=>{});
  },
};
