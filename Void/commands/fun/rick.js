// [RICK] Disguised rickroll
module.exports = {
  name: 'rick',
  description: 'Send a disguised rickroll link.',
  category: 'fun',
  usage: '<user>',
  async execute(message, args) {
    const u = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0].replace(/\D/g,'')).catch(()=>null) : null);
    const prefix = u ? `${u} ` : '';
    const links = [
      'https://bit.ly/3J8xLz9',
      'https://is.gd/nevergonna',
      'https://tinyurl.com/astley-87',
    ];
    const text = `${prefix}check this out: ${links[Math.floor(Math.random()*links.length)]}`;
    await message.delete().catch(()=>{});
    return message.channel.send(text);
  },
};
