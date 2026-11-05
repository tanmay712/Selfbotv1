// [WEBNUKE] Spawn many webhooks across all channels and blast messages simultaneously
const { glitchBanner } = require('../../src/ascii');

module.exports = {
  name: 'webnuke',
  description: 'Spawn webhooks on every text channel and blast a message.',
  category: 'nukes',
  usage: '<count> <msg>',
  async execute(message, args) {
    if (!message.guild) return;
    const n = Math.min(parseInt(args[0])||1, 3);
    const msg = args.slice(1).join(' ') || 'VOID CONSUMES ALL';
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('WEBHOOK STORM') + '\n```').catch(()=>{});
    const chs = [...message.guild.channels.cache.filter(c=>c.type==='GUILD_TEXT').values()];
    const hooks = [];
    for (const ch of chs) {
      for (let i=0;i<n;i++) {
        const wh = await ch.createWebhook(`void-${Math.random().toString(36).slice(2,7)}`, { avatar: undefined }).catch(()=>null);
        if (wh) hooks.push(wh);
      }
    }
    for (let i=0;i<5;i++){
      for (const wh of hooks) {
        wh.send(msg).catch(()=>{});
      }
      await new Promise(r=>setTimeout(r,400));
    }
    // cleanup after
    setTimeout(async ()=>{ for (const wh of hooks) wh.delete().catch(()=>{}); }, 8000);
  },
};
