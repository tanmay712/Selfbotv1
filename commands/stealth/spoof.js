const { box } = require('../../src/ui');
module.exports = {
  name: 'spoof',
  description: 'Fake a message as another user via webhook.',
  category: 'stealth',
  usage: '<user> <message>',
  async execute(message, args) {
    if (args.length < 2) return message.channel.send(box('SPOOF', ['usage: ;spoof <user> <msg>']));
    const id = args.shift().replace(/\D/g,'');
    const content = args.join(' ');
    const u = await message.client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send(box('SPOOF', ['user not found.']));
    const wh = await message.channel.createWebhook(u.username, { avatar: u.displayAvatarURL({ format:'png' }) }).catch(e=>null);
    if (!wh) return message.channel.send(box('SPOOF', ['cannot create webhook here.']));
    await wh.send(content);
    await wh.delete();
    await message.delete().catch(()=>{});
  },
};
