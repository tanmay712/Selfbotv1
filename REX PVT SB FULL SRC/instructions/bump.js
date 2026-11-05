let bumpIntervals = {};

module.exports = {
  name: 'bump',
  async execute(message, args, config) {
    const channelId = message.channel.id;

    try {
      await sendBumpCommand(message.channel);
    } catch (error) {
      console.error(`ERROR SENDING IMMEDIATE /BUMP COMMAND:`, error);
    }

    // PREVENT DETECTION 
    if (!bumpIntervals[channelId]) {
      const startBumping = () => {
        bumpIntervals[channelId] = setTimeout(async () => {
          try {
            await sendBumpCommand(message.channel);
          } catch (error) {
            console.error(`ERROR SENDING /BUMP COMMAND:`, error);
          }
          startBumping(); 
        }, Math.round(Math.random() * (9000000 - 7200000 + 1)) + 7200000);
      };
      startBumping();
      message.channel.send(`\`\`\`✔ STARTED SENDING /BUMP COMMAND AT RANDOM INTERVALS IN THIS CHANNEL.\`\`\``);
    } else {
      message.channel.send(`\`\`\`❗ ALREADY SENDING /BUMP COMMANDS IN THIS CHANNEL.\`\`\``);
    }
  }
};

async function sendBumpCommand(channel) {
  try {
    await channel.sendSlash('302050872383242240', 'bump');
  } catch (error) {
    console.error('FAILED TO SEND /BUMP COMMAND:', error);
  }
}
