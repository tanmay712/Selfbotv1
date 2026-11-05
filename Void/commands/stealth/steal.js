module.exports = {
  name: 'steal',
  aliases: ['clonepfp', 'copypfp'],
  description: "Steal a user's avatar (set as your own).",
  category: 'stealth',
  usage: '<user>',
  async execute(message, args, { client }) {
    const id = (args[0]||'').replace(/\D/g,'');
    if (!id) return message.channel.send('⬛ Mention or supply a user ID.');
    const u = await client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send('⬛ User not found.');
    const av = u.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 });
    await client.user.setAvatar(av).catch(e=>message.channel.send('⬛ Failed: '+e.message));
    message.channel.send('⬛ Avatar stolen.');
  },
};
