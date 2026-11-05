module.exports = {
    name: 'timeoutall',
    async execute(message) {
      message.guild.members.cache.forEach(m => {
        if (m.moderatable) m.timeout(604800000, 'Mass timeout').catch(() => {});
      });
      message.reply('7-day timeout applied to all members!');
    }
  };