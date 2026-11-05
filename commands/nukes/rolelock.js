// [ROLELOCK] Deny SEND_MESSAGES and ADD_REACTIONS on every role in every channel (locks server)
const { glitchBanner } = require('../../src/ascii');
const { box } = require('../../src/ui');

module.exports = {
  name: 'rolelock',
  description: 'Lock every channel so nobody can speak (deny SEND_MESSAGES for @everyone).',
  category: 'nukes',
  async execute(message) {
    if (!message.guild) return;
    await message.delete().catch(()=>{});
    await message.channel.send('```\n' + glitchBanner('LOCKDOWN') + '\n```').catch(()=>{});
    const chs = [...message.guild.channels.cache.filter(c=>c.type==='GUILD_TEXT').values()];
    for (const ch of chs) {
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SEND_MESSAGES: false, ADD_REACTIONS: false, CREATE_PUBLIC_THREADS: false }).catch(()=>{});
    }
    return message.channel.send(box('ROLELOCK', [`${chs.length} channels locked.`]));
  },
};
