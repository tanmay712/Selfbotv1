// [PURGE] Delete up to 100 recent messages. Splits out messages older than
// 14 days because Discord's bulkDelete rejects those and returns an error.
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
const { box, kvBox } = require('../../src/ui');

module.exports = {
  name: 'purge',
  aliases: ['prune', 'clear', 'clean'],
  description: 'Delete recent messages (filters out >14day msgs that bulkDelete cannot remove).',
  category: 'nukes',
  usage: '<count> [--force]',
  async execute(message, args) {
    const force = args.includes('--force') || args.includes('-f');
    const count = Math.min(parseInt(args.find(a => /^\d+$/.test(a))) || 20, 100);

    await message.delete().catch(() => {});

    let msgs;
    try {
      msgs = await message.channel.messages.fetch({ limit: count });
    } catch (e) {
      return message.channel.send(box('PURGE', [`failed to fetch: ${e.message}`]));
    }

    const now = Date.now();
    const bulkable = msgs.filter(m => now - m.createdTimestamp < TWO_WEEKS && !m.pinned);
    const tooOld  = msgs.filter(m => now - m.createdTimestamp >= TWO_WEEKS && !m.pinned);

    let bulked = 0, oldDeleted = 0, err = null;

    if (bulkable.size > 1) {
      try {
        const del = await message.channel.bulkDelete(bulkable, true);
        bulked = del.size;
      } catch (e) { err = e.message; }
    } else if (bulkable.size === 1) {
      try { await bulkable.first().delete().catch(()=>{}); bulked = 1; } catch(e){}
    }

    if (tooOld.size > 0 && force) {
      // Individually delete (slow; Discord may rate-limit)
      for (const m of tooOld.values()) {
        try { await m.delete().catch(()=>{}); oldDeleted++; await new Promise(r=>setTimeout(r,300)); }
        catch(_) {}
      }
    }

    const lines = [
      ['purged',  String(bulked)],
      ['too old (>14d)', String(tooOld.size) + (force ? `; deleted ${oldDeleted}` : ' (skipped; use --force)')],
    ];
    if (err) lines.push(['error', err.slice(0,120)]);
    const reply = await message.channel.send(kvBox('PURGE', lines)).catch(()=>null);
    if (reply) setTimeout(()=>reply.delete().catch(()=>{}), 4000);
  },
};
