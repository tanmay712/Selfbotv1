module.exports = {
  name: 'unnickall',
  aliases: [],
  async execute(message, args) {
    if (!message.guild) return;

    await message.guild.members.fetch();

    const members = message.guild.members.cache.filter(m => m.manageable && m.nickname && !m.user.bot);

    const tasks = [];
    for (const member of members.values()) {
      tasks.push(member.setNickname(null).catch(() => {}));
    }

    await Promise.all(tasks);
    message.channel.send(`\`\`\`✅ Ultra un-nicked ${members.size} members.\`\`\``);
  }
};
