module.exports = {
  name: 'raid',
  description: '⚠️ Mass message spam across every text channel in the server.',
  category: 'nukes',
  usage: '<count> <msg>',
  async execute(message, args) {
    if (!message.guild) return;
    const n = Math.min(parseInt(args[0])||5, 20);
    const text = args.slice(1).join(' ') || '⬛ VOID CONSUMES ALL';
    await message.delete().catch(()=>{});
    const textChannels = message.guild.channels.cache.filter(c=>c.type==='GUILD_TEXT');
    for (let i=0;i<n;i++){
      for (const c of textChannels.values()) {
        await c.send(text).catch(()=>{});
      }
      await new Promise(r=>setTimeout(r,400));
    }
  },
};
