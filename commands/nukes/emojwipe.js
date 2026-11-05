const { glitchBanner } = require('../../src/ascii');
module.exports = {
  name: 'emojwipe',
  aliases: ['emojinuke'],
  description: 'Delete every emoji.',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('EMOJIS ERASED') + '\n```').catch(()=>{});
    message.guild.emojis.cache.forEach(e=>e.delete().catch(()=>{}));
  },
};
