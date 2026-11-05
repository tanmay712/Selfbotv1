// [SELFGUARD] Toggle self-account protection (re-add stripped roles etc.)
const sg = require('../../src/protection/selfguard');
const { box, kvBox } = require('../../src/ui');

module.exports = {
  name: 'selfguard',
  aliases: ['sg','protect'],
  description: 'Protect your account against being stripped/kicked/banned.',
  category: 'protection',
  usage: '<arm|disarm|status>',
  async execute(message, args) {
    const sub = (args[0] || 'status').toLowerCase();
    if (sub === 'arm' || sub === 'on') { sg.arm(); return message.channel.send(box('SELFGUARD', ['armed.'])); }
    if (sub === 'disarm' || sub === 'off') { sg.disarm(); return message.channel.send(box('SELFGUARD', ['disarmed.'])); }
    return message.channel.send(kvBox('SELFGUARD', [['state', /* external */ 'see logs']]));
  },
};
