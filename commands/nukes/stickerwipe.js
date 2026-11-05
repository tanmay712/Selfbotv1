const { glitchBanner } = require('../../src/ascii');
module.exports = {
  name: 'stickerwipe',
  aliases: ['stickernuke'],
  description: 'Delete every sticker.',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('STICKERS PURGED') + '\n```').catch(()=>{});
    message.guild.stickers?.cache.forEach(s=>s.delete().catch(()=>{}));
  },
};
