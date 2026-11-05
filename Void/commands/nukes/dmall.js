module.exports = {
  name: 'dmall',
  description: '⚠️ DM every member of the server a message.',
  category: 'nukes',
  usage: '<message>',
  async execute(message, args) {
    if (!message.guild) return;
    const text = args.join(' ');
    if (!text) return message.channel.send('⬛ Provide a message.');
    await message.delete().catch(()=>{});
    const ms = await message.guild.members.fetch();
    let sent=0;
    for (const m of ms.values()) {
      if (m.user.bot) continue;
      try { await m.send(text); sent++; await new Promise(r=>setTimeout(r,600)); } catch(_){}
    }
    message.channel.send(`⬛ DM'd ${sent} members.`).then(x=>setTimeout(()=>x.delete().catch(()=>{}),4000));
  },
};
