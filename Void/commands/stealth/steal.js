const { box } = require('../../src/ui');
module.exports = {
  name: 'steal',
  aliases: ['clonepfp','copypfp'],
  description: "Steal a user's avatar.",
  category: 'stealth',
  usage: '<user>',
  async execute(message, args, { client }) {
    const id = (args[0]||'').replace(/\D/g,'');
    if (!id) return message.channel.send(box('STEAL', ['mention or supply a user id.']));
    const u = await client.users.fetch(id).catch(()=>null);
    if (!u) return message.channel.send(box('STEAL', ['user not found.']));
    const av = u.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 });
    await client.user.setAvatar(av).catch(e=>message.channel.send(box('STEAL', [e.message])));
    return message.channel.send(box('STEAL', ['avatar stolen.']));
  },
};
