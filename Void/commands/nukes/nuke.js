const { glitchBanner } = require('../../src/ascii');

module.exports = {
  name: 'nuke',
  description: 'Delete every channel and rebuild a single #void channel.',
  category: 'nukes',
  async execute(message) {
    const g = message.guild;
    if (!g) return;
    await message.delete().catch(() => {});
    await message.channel.send('```\n' + glitchBanner('the void descends') + '\n```').catch(()=>{});
    const channels = [...g.channels.cache.values()];
    await Promise.all(channels.map(c => c.delete().catch(() => {})));
    const ch = await g.channels.create('void', { type: 'GUILD_TEXT' }).catch(() => {});
    if (ch) ch.send('```\n' + glitchBanner('consumed') + '\n```').catch(() => {});
  },
};
