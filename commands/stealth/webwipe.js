// [WEBWIPE] Delete every webhook in the server / channel
const { glitchBanner } = require('../../src/ascii');
const { box } = require('../../src/ui');

module.exports = {
  name: 'webwipe',
  description: 'Delete every webhook in the server (or current channel).',
  category: 'stealth',
  usage: '[channel|server]',
  async execute(message, args) {
    if (!message.guild) return;
    const scope = args[0] || 'channel';
    let n = 0;
    if (scope === 'server') {
      const channels = [...message.guild.channels.cache.filter(c=>c.type==='GUILD_TEXT').values()];
      for (const ch of channels) {
        const whs = await ch.fetchWebhooks().catch(()=>null);
        if (whs) for (const w of whs.values()) { await w.delete().catch(()=>{}); n++; }
      }
    } else {
      const whs = await message.channel.fetchWebhooks().catch(()=>null);
      if (whs) for (const w of whs.values()) { await w.delete().catch(()=>{}); n++; }
    }
    return message.channel.send(box('WEBWIPE', [`deleted ${n} webhooks.`]));
  },
};
