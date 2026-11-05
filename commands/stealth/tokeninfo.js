// [TOKENINFO] Validate/decode a Discord user token (no network - purely local parsing)
const { kvBox, box } = require('../../src/ui');

function decodeToken(tok) {
  try {
    // Discord user tokens are 3 dot-separated base64 parts: userid.crc.hmac
    // bot tokens are longer / different. We just decode the base64 userid part.
    const parts = tok.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'not 3 parts' };
    const idB64 = parts[0];
    const pad = '='.repeat((4 - idB64.length % 4) % 4);
    const userId = Buffer.from(idB64.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
    const ts = parseInt(userId) >> 22;
    const createdAt = new Date(ts + 1420070400000);
    return { valid: /^\d+$/.test(userId), userId, createdAt: createdAt.toISOString(), length: tok.length };
  } catch (e) { return { valid: false, reason: e.message }; }
}

module.exports = {
  name: 'tokeninfo',
  aliases: ['tinfo'],
  description: 'Decode a Discord user token locally (userid + account creation time).',
  category: 'stealth',
  usage: '<token>',
  async execute(message, args) {
    const tok = args[0];
    if (!tok) return message.channel.send(box('TOKENINFO', ['usage: ;tokeninfo <token>']));
    const info = decodeToken(tok);
    if (!info.valid) return message.channel.send(kvBox('TOKENINFO', [['valid', 'NO'], ['reason', info.reason || 'bad token']]));
    await message.delete().catch(()=>{});
    return message.channel.send(kvBox('TOKENINFO', [
      ['valid', 'YES'],
      ['user id', info.userId],
      ['created', info.createdAt.split('T')[0]],
      ['length', String(info.length)],
    ]));
  },
};
