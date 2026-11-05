module.exports = {
  name: 'ghostping',
  aliases: ['gp'],
  description: 'Ping everyone in the channel then delete instantly.',
  category: 'stealth',
  usage: '[#channel]',
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    try {
      const m = await ch.send('@everyone');
      await m.delete();
      await message.delete().catch(()=>{});
    } catch(e) {
      message.channel.send('⬛ Failed: ' + e.message);
    }
  },
};
