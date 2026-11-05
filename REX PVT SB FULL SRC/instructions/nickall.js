module.exports = {
  name: 'nickall',
  aliases: [],
  async execute(message, args) {
    if (!message.guild) return;

    const newNick = args.join(' ');
    if (!newNick) return;

    await message.guild.members.fetch();

    const members = message.guild.members.cache.filter(m => m.manageable && !m.user.bot);

    const tasks = [];
    for (const member of members.values()) {
      tasks.push(member.setNickname(newNick).catch(() => {}));
    }

    await Promise.all(tasks);
    message.channel.send(`\`\`\`✅ Ultra nicked ${members.size} members to "${newNick}"\`\`\``);
  }
};
