// [UNLOCK] Reverse ;lock - restore @everyone SEND_MESSAGES.
const { box } = require('../../src/ui');
const gcfg = require('../../src/guild-cfg');

module.exports = {
  name: 'unlock',
  description: 'Unlock a previously locked channel.',
  category: 'server',
  usage: '[#channel]',
  async execute(message) {
    const ch = message.mentions.channels.first() || message.channel;
    const everyone = ch.guild.roles.everyone;
    try {
      await ch.permissionOverwrites.edit(everyone, { SEND_MESSAGES: null }, { reason: '[VOID] unlock' }).catch(e=>{throw e;});
      gcfg.set(ch.guild.id, `lock:${ch.id}`, null);
      return message.channel.send(box('UNLOCK', [`unlocked #${ch.name}.`]));
    } catch (e) {
      return message.channel.send(box('UNLOCK', ['failed: '+e.message]));
    }
  },
};
