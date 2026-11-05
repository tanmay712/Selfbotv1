const { box } = require('../../src/ui');
module.exports = {
  name: 'purge',
  aliases: ['prune','clear'],
  description: 'Delete up to 100 recent messages.',
  category: 'nukes',
  usage: '<count>',
  async execute(message, args) {
    const n = Math.min(parseInt(args[0])||20, 100);
    await message.delete().catch(()=>{});
    const msgs = await message.channel.messages.fetch({ limit:n });
    await message.channel.bulkDelete(msgs, true).catch(()=>{});
  },
};
