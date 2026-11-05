// [FAKEBAN] Send a fake-looking ban message to a user via DM
const { box } = require('../../src/ui');

module.exports = {
  name: 'fakeban',
  description: 'Send a fake ban DM to a user (looks like a system ban notice).',
  category: 'stealth',
  usage: '<user> [reason]',
  async execute(message, args) {
    const id = args[0]?.replace(/\D/g, '');
    if (!id) return message.channel.send(box('FAKEBAN', ['mention a user.']));
    const u = await message.client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send(box('FAKEBAN', ['user not found.']));
    const reason = args.slice(1).join(' ') || 'violation of Terms of Service';
    const msg = [
      '==================================================',
      '|  DISCORD // ACCOUNT TERMINATION NOTICE         |',
      '==================================================',
      `|  user    : ${padR(u.tag, 35)}|`,
      `|  user id : ${padR(u.id, 35)}|`,
      '|                                                |',
      `|  reason  : ${padR(reason.slice(0,35), 35)}|`,
      '|                                                |',
      '|  appeal  : appeals@discord.com                 |',
      '|  status  : PERMANENT                           |',
      '==================================================',
      '|  this is an automated message, do not reply.   |',
      '==================================================',
    ].join('\n');
    try {
      await u.send('```\n' + msg + '\n```');
      return message.channel.send(box('FAKEBAN', ['fake ban notice delivered.']));
    } catch(e) {
      return message.channel.send(box('FAKEBAN', [e.message]));
    }
  },
};

function padR(s, n){ s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
