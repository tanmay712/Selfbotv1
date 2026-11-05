// [ASCIIPROFILE] Render user info as a fancy ASCII card
module.exports = {
  name: 'asciiprofile',
  aliases: ['profile', 'card'],
  description: 'Render user info as an ASCII card.',
  category: 'fun',
  usage: '[user]',
  async execute(message, args) {
    const id = (args[0]||message.author.id).replace(/\D/g,'') || message.author.id;
    const u = await message.client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send('```[PROFILE] user not found.```');
    const m = message.guild?.members.cache.get(u.id);
    const W = 50;
    const lrPad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
    const ctr = (s, n) => { const l = Math.floor((n-s.length)/2); return ' '.repeat(Math.max(0,l)) + s + ' '.repeat(Math.max(0, n - s.length - l)); };
    const line = (k,v) => `| ${lrPad(k+':', 12)} ${lrPad(String(v).slice(0,W-16), W-16)}|`;
    const bar = '+' + '-'.repeat(W-2) + '+';
    const out = [
      bar,
      '|' + ctr('V O I D   P R O F I L E', W-2) + '|',
      bar,
      line('tag', u.tag),
      line('id', u.id),
      line('bot', u.bot),
      line('created', u.createdAt.toISOString().split('T')[0]),
      line('status', u.presence?.status || 'unknown'),
    ];
    if (m) {
      out.push(line('joined', m.joinedAt?.toISOString().split('T')[0] || '?'));
      out.push(line('nick', m.nickname || '(none)'));
      out.push(line('top role', m.roles?.highest?.name || '?'));
    }
    out.push(bar);
    return message.channel.send('```\n' + out.join('\n') + '\n```');
  },
};
