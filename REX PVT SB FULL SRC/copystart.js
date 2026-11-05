const instruction = require('./instruction');

const raiderState = {};

module.exports = {
  name: 'start',
  description: 'Starts high-speed spamming and renaming',
  aliases: [],

  async execute(message) {
    const channelId = message.channel.id;

    if (raiderState[channelId]) {
      return message.reply('```⚠️ Raider already running```');
    }

    let messageIndex = 0;
    let renameIndex = 0;

    // Ultra-fast spam function (no interval)
    const spamLoop = async () => {
      while (raiderState[channelId]) {
        try {
          await message.channel.send(instruction.spamMessages[messageIndex % instruction.spamMessages.length]);
          messageIndex++;
        } catch (e) {
          console.error('Spam error:', e);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };

    // Fast rename function (no interval)
    const renameLoop = async () => {
      while (raiderState[channelId]) {
        try {
          if (message.channel.setName) {
            await message.channel.setName(instruction.renameCycle[renameIndex % instruction.renameCycle.length]);
            renameIndex++;
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        } catch (e) {
          console.error('Rename error:', e);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    };

    // Start both loops
    raiderState[channelId] = true;
    spamLoop();
    renameLoop();

    await message.reply('```⚡ ULTRA-FAST RAID STARTED (Continuous)```');
  }
};