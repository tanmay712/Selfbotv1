module.exports = {
    name: 'kickall',
    async execute(message) {
      if (!message.member.permissions.has('ADMINISTRATOR')) 
        return message.reply('❌ Administrator permission required!');
  
      message.guild.members.cache.forEach(member => {
        if (member.kickable && !member.user.bot) {
          member.kick('Mass kick').catch(() => {});
        }
      });
      message.reply('⚡ Mass kick initiated!');
    }
  };