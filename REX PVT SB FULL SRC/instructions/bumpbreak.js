let bumpIntervals = {};

module.exports = {
  name: 'bumpbreak',
  execute(message, args, config) {
    const channelId = message.channel.id;

    if (bumpIntervals[channelId]) {
      clearTimeout(bumpIntervals[channelId]);
      delete bumpIntervals[channelId];
      message.channel.send(`\`\`\`✅ STOPPED SENDING /BUMP COMMANDS IN THIS CHANNEL.\`\`\``);
    } else {
      message.channel.send(`\`\`\`❌ NO /BUMP COMMAND IS CURRENTLY BEING SENT IN THIS CHANNEL.\`\`\``);
    }
  }
};
