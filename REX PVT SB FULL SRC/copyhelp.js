module.exports = {
  name: 'help',
  async execute(message, args, config) {
    const prefix = config.prefix;

    const commands = [
      `**[${prefix}] PURGEME`,
      `[${prefix}] SPAM`,
      `[${prefix}] DELETE`,
      `[${prefix}] BUMP`,
      `[${prefix}] BUMPBREAK`,
      `[${prefix}] PING`, 
      `[${prefix}] PREFIX`,
      `[${prefix}] SETPREFIX`,
      `[${prefix}] PURGEME`, 
      `[${prefix}] LLM`,
      `[${prefix}] ACTIVITY`,
      `[${prefix}] COPYCAT`,
      `\n**--- ROAST COMMANDS ---**`,
      `[${prefix}] FUCK - ABUSE IN URDU/HINDI LANGUAGE`,  
      `[${prefix}] FUCK2 - ENGLISH FUNNY ROASTS`,
      `[${prefix}] FUCK3 - TECH STYLE SPAMMY ROASTS`,
      `[${prefix}] FUCK4 - FRIENDLY CLEAN INSULTS`,
      `[${prefix}] FUCK5 - ULTRA FAST 200+ ROAST LINES`,
      `[${prefix}] FUCK6 - FUNNY HINDI ROASTS`,
      `[${prefix}] FUCK7 - FUNNY URDU ROASTS`
    ];

    let helpMessage = `# HAROON INV PRIVATE $ELF-BOT\n**\`\`\`yml\n<> - MADE BY HAROON INV\n[] - USE ${prefix} AS PREFIX\n\`\`\`**\n`;

    helpMessage += commands.join('\n') + '\n';
    helpMessage += `\`\`\`</>  HK PRIVATE $ELF-BOT   !\`\`\`**`;

    message.channel.send(helpMessage);
  }
};