module.exports = {
  name: 'renameall',
  aliases: ['nickall'],
  description: '⚠️ Rename every member to a void-themed nickname.',
  category: 'nukes',
  usage: '[name]',
  async execute(message, args) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    const name = args.join(' ') || 'consumed-by-void';
    const ms = await message.guild.members.fetch();
    ms.forEach(m=>{ if (m.manageable && m.id !== message.guild.ownerId) m.setNickname(name).catch(()=>{}); });
  },
};
