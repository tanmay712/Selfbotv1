// [HISTORYWIPE] Delete your own recent messages across a guild (or a single channel)
const { box, progress } = require('../../src/ui');

module.exports = {
  name: 'historywipe',
  aliases: ['wipehistory', 'purgeself'],
  description: 'Delete your own recent messages across a server (or current channel).',
  category: 'stealth',
  usage: '[channel|guild]',
  async execute(message, args) {
    const scope = (args[0] || 'channel').toLowerCase();
    let channels = [];
    if (scope === 'guild' && message.guild) {
      channels = [...message.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').values()];
    } else {
      channels = [message.channel];
    }

    const status = await message.channel.send('```[HISTORYWIPE] scanning...\n[' + progress(0) + ']  0%```');
    let deleted = 0;
    let scannedCh = 0;

    for (const ch of channels) {
      try {
        let last;
        // walk up to 10 batches per channel
        for (let batch = 0; batch < 10; batch++) {
          const opts = { limit: 100 };
          if (last) opts.before = last;
          const msgs = await ch.messages.fetch(opts).catch(() => null);
          if (!msgs || msgs.size === 0) break;
          const mine = msgs.filter(m => m.author.id === message.client.user.id);
          for (const m of mine.values()) {
            await m.delete().catch(() => {});
            deleted++;
            await new Promise(r => setTimeout(r, 350));
          }
          last = msgs.last()?.id;
          if (msgs.size < 100) break;
        }
      } catch (_) {}
      scannedCh++;
      const pct = scannedCh / channels.length;
      await status.edit('```[HISTORYWIPE] scrubbing...\n' + progress(pct) + ' ' + Math.floor(pct * 100) + '%  deleted=' + deleted + '```').catch(() => {});
    }
    await status.edit(box('HISTORYWIPE', [`channels scanned: ${scannedCh}`, `deleted: ${deleted}`]));
  },
};
