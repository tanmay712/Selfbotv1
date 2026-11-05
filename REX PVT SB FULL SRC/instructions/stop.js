const raiderState = require('./start').raiderState;

module.exports = {
  name: 'stop',
  description: 'Stops the raider',
  aliases: [],

  async execute(message) {
    const channelId = message.channel.id;
    
    if (!raiderState[channelId]) {
      return message.reply('```⚠️ No raider active in this channel```');
    }

    // Immediately stop the raider
    raiderState[channelId] = false;
    await message.reply('```🛑 RAIDER STOPPED```');
  }
};