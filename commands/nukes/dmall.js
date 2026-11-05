const { glitchBanner, box } = require('../../src/ascii');
const { kvBox } = require('../../src/ui');
module.exports = {
  name: 'dmall',
  description: 'DM every member of the server.',
  category: 'nukes',
  usage: '<message>',
  async execute(message, args) {
    if (!message.guild) return;
    const text = args.join(' ');
    if (!text) return message.channel.send('```[DMALL] provide a message.```');
    await message.delete().catch(()=>{});
    const ms = await message.guild.members.fetch();
    let sent=0,fail=0;
    for (const m of ms.values()) {
      if (m.user.bot) continue;
      try { await m.send(text); sent++; await new Promise(r=>setTimeout(r,600)); } catch(_){ fail++; }
    }
    return message.channel.send(kvBox('DMALL', [['sent', String(sent)], ['failed', String(fail)]])).then(x=>setTimeout(()=>x.delete().catch(()=>{}),6000));
  },
};
