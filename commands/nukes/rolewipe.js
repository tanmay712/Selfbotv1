const { glitchBanner } = require('../../src/ascii');
module.exports = {
  name: 'rolewipe',
  aliases: ['rolenuke'],
  description: 'Delete every editable role except @everyone.',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('ROLES PURGED') + '\n```').catch(()=>{});
    message.guild.roles.cache.forEach(r=>{ if (r.name!=='@everyone' && r.editable) r.delete().catch(()=>{}); });
  },
};
