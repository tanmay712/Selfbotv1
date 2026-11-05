module.exports = {
  name: 'stickerwipe',
  aliases: ['stickernuke'],
  description: '⚠️ Delete every sticker in the server.',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    message.guild.stickers?.cache.forEach(s=>s.delete().catch(()=>{}));
  },
};
