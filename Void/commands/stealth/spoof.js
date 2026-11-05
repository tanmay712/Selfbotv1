module.exports = {
  name: 'spoof',
  description: 'Fake a system-looking message via webhook impersonation of a user.',
  category: 'stealth',
  usage: '<user> <message>',
  async execute(message, args) {
    if (args.length < 2) return message.channel.send('⬛ Usage: ;spoof <user> <msg>');
    const id = args.shift().replace(/\D/g,'');
    const content = args.join(' ');
    const u = await message.client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send('⬛ User not found.');
    const wh = await message.channel.createWebhook(u.username, { avatar: u.displayAvatarURL({ format:'png' }) }).catch(e=>null);
    if (!wh) return message.channel.send('⬛ Cannot create webhook here.');
    await wh.send(content);
    await wh.delete();
    await message.delete().catch(()=>{});
  },
};
