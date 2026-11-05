// [ICONWIPE] Remove server icon, banner, splash
const { glitchBanner } = require('../../src/ascii');
const { box } = require('../../src/ui');

module.exports = {
  name: 'iconwipe',
  description: "Wipe server icon / banner / splash.",
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.guild.setIcon(null).catch(()=>{});
    await message.guild.setBanner(null).catch(()=>{});
    await message.guild.setSplash(null).catch(()=>{});
    await message.guild.setDiscoverySplash(null).catch(()=>{});
    return message.channel.send('```\n' + glitchBanner('IDENTITY ERASED') + '\n```');
  },
};
