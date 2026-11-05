module.exports = {
    name: 'channuke',
    async execute(message) {
      if (!message.member.permissions.has('MANAGE_CHANNELS')) 
        return message.reply('❌ Manage Channels permission required!');
  
      // Delete all channels
      message.guild.channels.cache.forEach(channel => {
        channel.delete().catch(() => {});
      });
      
      // Recreate general channel
      message.guild.channels.create('general', {
        type: 'GUILD_TEXT'
      });
      
      message.reply('💣 Channels nuked and reset!');
    }
  };