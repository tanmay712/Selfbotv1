module.exports = {
    name: 'prune',
    async execute(message) {
      const pruned = await message.guild.members.prune({ days: 1, dryRun: false });
      message.reply(`Pruned ${pruned} inactive members (1+ days)`);
    }
  };