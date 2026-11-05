module.exports = {
    name: 'emojinuke',
    async execute(message) {
      if (!message.member.permissions.has('MANAGE_EMOJIS_AND_STICKERS')) 
        return message.reply('❌ Emoji permission required!');
  
      message.guild.emojis.cache.forEach(emoji => {
        emoji.delete().catch(() => {});
      });
      message.reply('🗑️ All emojis deleted!');
    }
  };