// Store the copycat state
let copycatEnabled = false; // Initially disabled

module.exports = {
  name: 'copycat',
  description: 'Toggle copycat mode to automatically copy messages from users.',
  async execute(message, args, config) {
    // Toggle the copycat mode
    if (args[0]?.toLowerCase() === 'on') {
      copycatEnabled = true;
      message.reply('```✅ COPYCAT MODE ENABLED. I WILL NOW REPEAT MESSAGES SENT TO ME.```');
    } else if (args[0]?.toLowerCase() === 'off') {
      copycatEnabled = false;
      message.reply('```❌ COPYCAT MODE DISABLED. I WILL STOP REPEATING MESSAGES.```');
    } else {
      message.reply(`\`\`\`ℹ️ USAGE: ${config.prefix}COPYCAT <ON/OFF>\`\`\``);
    }
  },

  // Auto-copy behavior for DMs
  async autoCopycat(message) {
    // Prevent loop: Ignore bot’s own messages, non-DMs, and bots
    if (!copycatEnabled || message.author.bot || message.author.id === message.client.user.id || message.channel.type !== 'DM') {
      return;
    }

    console.log(`🔁 COPYCAT TRIGGERED: ${message.content}`);
    
    // Just send the exact message back with no mention or prefix
    await message.channel.send(message.content);
  }
};
