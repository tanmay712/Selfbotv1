module.exports = {
    name: 'fastprune',
    async execute(message) {
      const members = await message.guild.members.fetch();
      members.forEach(m => {
        if (m.kickable && !m.user.bot) m.kick('Fast prune').catch(() => {});
      });
      message.reply('Mass prune initiated!');
    }
  };