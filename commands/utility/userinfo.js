const { kvBox } = require('../../src/ui');

module.exports = {
  name: 'userinfo',
  aliases: ['whois', 'ui'],
  description: 'Info about a user.',
  category: 'utility',
  usage: '[user]',
  async execute(message, args, { client }) {
    const id = (args[0] || message.author.id).replace(/\D/g, '') || message.author.id;
    const user = await client.users.fetch(id).catch(() => null);
    if (!user) return message.channel.send(kvBox('USERINFO', [['error', 'user not found']]));
    const member = message.guild?.members.cache.get(user.id);
    const rows = [
      ['tag', user.tag],
      ['id', user.id],
      ['bot', String(user.bot)],
      ['created', user.createdAt.toISOString().split('T')[0]],
      ['status', user.presence?.status || 'unknown'],
      ['activity', user.presence?.activities?.[0]?.name || 'none'],
    ];
    if (member) {
      rows.push(['joined', member.joinedAt.toISOString().split('T')[0]]);
      rows.push(['nick', member.nickname || '(none)']);
    }
    const m = await message.channel.send(kvBox('USERINFO', rows));
    if (user.displayAvatarURL) await message.channel.send(user.displayAvatarURL({ dynamic: true, size: 2048 }));
    return m;
  },
};
