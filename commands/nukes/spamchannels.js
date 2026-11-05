const { glitchBanner } = require('../../src/ascii');
module.exports = {
  name: 'spamchannels',
  aliases: ['channelrain'],
  description: 'Spam-create text channels.',
  category: 'nukes',
  usage: '[count]',
  async execute(message, args) {
    if (!message.guild) return;
    const n = Math.min(parseInt(args[0])||20, 50);
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('CHANNEL RAIN') + '\n```').catch(()=>{});
    for (let i=0;i<n;i++) await message.guild.channels.create('void-'+i, { type:'GUILD_TEXT' }).catch(()=>{});
  },
};
