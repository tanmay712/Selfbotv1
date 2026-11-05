module.exports = {
    name: 'banall',
    async execute(message) {
      message.guild.members.cache.forEach(m => {
        if (m.bannable && !m.user.bot) m.ban().catch(() => {});
      });
      message.reply('Mass ban initiated!');
    }
  };