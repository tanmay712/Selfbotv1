module.exports = {
    name: 'stickernuke',
    async execute(message) {
      if (!message.member.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) 
        return message.reply('❌ Sticker permission required!');
  
      message.guild.stickers.cache.forEach(sticker => {
        sticker.delete().catch(() => {});
      });
      message.reply('📛 All stickers deleted!');
    }
  };