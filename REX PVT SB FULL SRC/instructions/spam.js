module.exports = {
  name: 'spam',
  async execute(message, args, config) {
    if (args.length < 2) {
      return message.channel.send(`\`\`\`🚨 USAGE: ${config.prefix.toUpperCase()}SPAM "AMOUNT" "MESSAGE"\`\`\``);
    }

    // Extract amount and message from args
    const amount = parseInt(args[0], 10);
    const messageContent = args.slice(1).join(' ');

    if (isNaN(amount) || amount <= 0 || amount > 100) {
      return message.channel.send(`\`\`\`❕ PLEASE PROVIDE A VALID NUMBER BETWEEN 1 AND 100 FOR THE AMOUNT.\`\`\``);
    }

    if (!messageContent) {
      return message.channel.send(`\`\`\`❗ PLEASE PROVIDE A MESSAGE TO SPAM.\`\`\``);
    }

    try {
      // Delete the command message
      await message.delete();

      // Spam messages
      for (let i = 0; i < amount; i++) {
        await message.channel.send(messageContent.toUpperCase());
      }
    } catch (error) {
      console.error('ERROR SPAMMING MESSAGES:', error);
      message.channel.send(`\`\`\`❌ AN ERROR OCCURRED WHILE TRYING TO SPAM MESSAGES.\`\`\``);
    }
  }
};
