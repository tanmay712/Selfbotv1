module.exports = {
  name: 'serverinfo',
  aliases: ['si', 'guildinfo'],
  description: 'Get info about the current server.',
  category: 'utility',
  async execute(message) {
    const g = message.guild;
    if (!g) return message.channel.send('⬛ Not in a guild.');
    const out = [
      '⬛ **VOID SERVER INFO**',
      '```',
      `Name:      ${g.name}`,
      `ID:        ${g.id}`,
      `Owner:     ${(await g.fetchOwner().catch(()=>({user:{tag:'unknown'}})))?.user.tag}`,
      `Members:   ${g.memberCount}`,
      `Channels:  ${g.channels.cache.size}`,
      `Roles:     ${g.roles.cache.size}`,
      `Emojis:    ${g.emojis.cache.size}`,
      `Boosts:    ${g.premiumSubscriptionCount || 0}`,
      `Created:   ${g.createdAt.toISOString().split('T')[0]}`,
      `Shard:     ${g.shard?.id ?? 0}`,
      '```',
      g.iconURL({ dynamic: true, size: 2048 }) || '',
    ].filter(Boolean).join('\n');
    message.channel.send(out);
  },
};
