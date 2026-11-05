const { box } = require('../../src/ui');
module.exports = {
  name: 'ghostping',
  aliases: ['gp'],
  description: 'Ping @everyone and delete instantly.',
  category: 'stealth',
  usage: '[#channel]',
  async execute(message) {
    const ch = message.mentions.channels.first() || message.channel;
    try { const m = await ch.send('@everyone'); await m.delete(); await message.delete().catch(()=>{}); }
    catch(e) { message.channel.send(box('GHOSTPING', [e.message])); }
  },
};
