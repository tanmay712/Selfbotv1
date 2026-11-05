// [VANISH] Wipe your messages in current channel and (optionally) leave the server
const { box, progress } = require('../../src/ui');

module.exports = {
  name: 'vanish',
  description: 'Delete your recent messages in this channel then (optionally) leave the server.',
  category: 'stealth',
  usage: '[leave]',
  async execute(message, args) {
    const doLeave = args[0] === 'leave';
    const status = await message.channel.send('```[VANISH] scrubbing...\n[' + progress(0) + ']  0%```');
    let deleted = 0;
    let last;
    for (let batch = 0; batch < 10; batch++) {
      const opts = { limit: 100 };
      if (last) opts.before = last;
      const msgs = await message.channel.messages.fetch(opts).catch(() => null);
      if (!msgs || msgs.size === 0) break;
      const mine = msgs.filter(m => m.author.id === message.client.user.id);
      for (const m of mine.values()) { await m.delete().catch(()=>{}); deleted++; await new Promise(r=>setTimeout(r,300)); }
      last = msgs.last()?.id;
      const pct = Math.min(1, (batch+1)/10);
      await status.edit('```[VANISH] scrubbing...\n' + progress(pct) + ' ' + Math.floor(pct*100) + '%  deleted=' + deleted + '```').catch(()=>{});
      if (msgs.size < 100) break;
    }
    await status.edit(box('VANISH', [`deleted: ${deleted}`, doLeave ? 'leaving server...' : 'done.'])).catch(()=>{});
    if (doLeave && message.guild) {
      await new Promise(r=>setTimeout(r,800));
      await message.guild.leave().catch(()=>{});
    }
  },
};
