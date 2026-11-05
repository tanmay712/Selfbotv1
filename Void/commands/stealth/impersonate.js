const { box } = require('../../src/ui');
module.exports = {
  name: 'impersonate',
  aliases: ['clone'],
  description: "Clone target's nickname and avatar.",
  category: 'stealth',
  usage: '<user>',
  async execute(message, args, { client }) {
    const id = (args[0]||'').replace(/\D/g,'');
    if (!id) return message.channel.send(box('IMPERSONATE', ['mention a user.']));
    const u = await client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send(box('IMPERSONATE', ['user not found.']));
    try {
      if (message.guild) await message.guild.members.cache.get(client.user.id).setNickname(u.username).catch(()=>{});
      await client.user.setAvatar(u.displayAvatarURL({ dynamic:true, format:'png', size:1024 })).catch(()=>{});
      return message.channel.send(box('IMPERSONATE', [`now impersonating ${u.tag}.`]));
    } catch(e) { return message.channel.send(box('IMPERSONATE', [e.message])); }
  },
};
