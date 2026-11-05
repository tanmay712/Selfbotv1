module.exports = {
    name: 'muteall',
    async execute(message) {
      if (!message.member.permissions.has('MUTE_MEMBERS')) 
        return message.reply('❌ Mute permission required!');
  
      message.guild.members.cache.forEach(member => {
        if (member.manageable) {
          member.voice.setMute(true).catch(() => {});
          // Text mute would require role manipulation
        }
      });
      message.reply('🔇 Server-wide mute applied!');
    }
  };