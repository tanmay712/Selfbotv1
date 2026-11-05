module.exports = {
  name: 'userinfo',
  aliases: ['whois', 'ui'],
  description: 'Get info about a user.',
  category: 'utility',
  usage: '[user]',
  async execute(message, args, { client }) {
    const id = (args[0] || message.author.id).replace(/\D/g, '') || message.author.id;
    const user = await client.users.fetch(id).catch(()=>null);
    if (!user) return message.channel.send('⬛ User not found.');
    const member = message.guild?.members.cache.get(user.id);
    const lines = [
      '⬛ **VOID USER INFO**',
      `\`\`\``,
      `Tag:      ${user.tag}`,
      `ID:       ${user.id}`,
      `Bot:      ${user.bot}`,
      `Created:  ${user.createdAt.toISOString().split('T')[0]}`,
      `Status:   ${user.presence?.status || 'unknown'}`,
      `Activity: ${user.presence?.activities?.[0]?.name || 'none'}`,
      member ? `Joined:   ${member.joinedAt.toISOString().split('T')[0]}` : '',
      member ? `Nick:     ${member.nickname || 'none'}` : '',
      `\`\`\``,
      user.displayAvatarURL({ dynamic: true, size: 2048 }),
    ].filter(Boolean).join('\n');
    message.channel.send(lines);
  },
};
