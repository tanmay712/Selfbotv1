// [LOCK] Deny @everyone SEND_MESSAGES (or a specific permission) in a channel.
// [UNLOCK] Restore it.
const { box, kvBox } = require('../../src/ui');
const gcfg = require('../../src/guild-cfg');
const { Permissions } = require('discord.js-selfbot-v13');

module.exports = {
  name: 'lock',
  description: 'Lock a channel (deny @everyone SEND_MESSAGES). Use ;unlock to reverse.',
  category: 'server',
  usage: '[#channel]',
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    const everyone = ch.guild.roles.everyone;
    try {
      // Store original perms so unlock can restore cleanly.
      const origOverwrites = ch.permissionOverwrites.cache.get(everyone.id)?.deny?.bitfield ?? 0n;
      gcfg.set(ch.guild.id, `lock:${ch.id}`, { denied: origOverwrites.toString(), lockedAt: Date.now() });
      await ch.permissionOverwrites.edit(everyone, { SEND_MESSAGES: false }, { reason: '[VOID] lock' }).catch(e=>{throw e;});
      await message.channel.send(box('LOCK', [`locked #${ch.name} (SEND_MESSAGES denied for @everyone).`]));
    } catch (e) {
      return message.channel.send(box('LOCK', ['failed: '+e.message]));
    }
  },
};
