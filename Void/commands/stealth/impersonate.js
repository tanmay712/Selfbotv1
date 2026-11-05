module.exports = {
  name: 'impersonate',
  aliases: ['clone'],
  description: "Clone a user's nickname and avatar in this server.",
  category: 'stealth',
  usage: '<user>',
  async execute(message, args, { client }) {
    const id = (args[0]||'').replace(/\D/g,'');
    if (!id) return message.channel.send('⬛ Mention a user.');
    const u = await client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send('⬛ User not found.');
    try {
      if (message.guild) {
        await message.guild.members.cache.get(client.user.id).setNickname(u.username).catch(()=>{});
      }
      await client.user.setAvatar(u.displayAvatarURL({ dynamic:true, format:'png', size:1024 })).catch(()=>{});
      message.channel.send(`⬛ Impersonating **${u.tag}**.`);
    } catch(e) { message.channel.send('⬛ '+e.message); }
  },
};
