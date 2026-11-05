const { kvBox } = require('../../src/ui');

module.exports = {
  name: 'serverinfo',
  aliases: ['si', 'guildinfo'],
  description: 'Info about the current server.',
  category: 'utility',
  async execute(message) {
    const g = message.guild;
    if (!g) return message.channel.send(kvBox('SERVERINFO', [['error', 'not in a guild']]));
    const owner = await g.fetchOwner().catch(() => ({ user: { tag: 'unknown' } }));
    const rows = [
      ['name', g.name],
      ['id', g.id],
      ['owner', owner?.user?.tag || 'unknown'],
      ['members', String(g.memberCount)],
      ['channels', String(g.channels.cache.size)],
      ['roles', String(g.roles.cache.size)],
      ['emojis', String(g.emojis.cache.size)],
      ['boosts', String(g.premiumSubscriptionCount || 0)],
      ['created', g.createdAt.toISOString().split('T')[0]],
    ];
    const m = await message.channel.send(kvBox('SERVERINFO', rows));
    if (g.iconURL) await message.channel.send(g.iconURL({ dynamic: true, size: 2048 }));
    return m;
  },
};
