const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'help',
  async execute(message, args, config) {
    const prefix = config.prefix;

    // First page - General & Server Moderation
    const helpText1 = `
╔════════════════════════════════════════╗
║          Rex † 666 sb pvt v1           ║
╚════════════════════════════════════════╝

             BOT COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${prefix}help        - Show bot help menu
  ${prefix}ping        - Show bot current ping
  ${prefix}prefix      - Show bot current prefix
  ${prefix}setprefix   - Change bot prefix

           SERVER MODERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${prefix}nickall     - Change all member nicknames
  ${prefix}unnickall   - Reset nicknames to default
  ${prefix}banall      - Ban all server members
  ${prefix}kickall     - Kick all server members
  ${prefix}channuke    - Delete all server channels
  ${prefix}rolenuke    - Delete all server roles
  ${prefix}muteall     - Mute all server members
  ${prefix}timeoutall  - Timeout all members (7d)
  ${prefix}untimeoutall - Remove timeout from all
  ${prefix}emojinuke   - Delete all server emojis
  ${prefix}stickernuke - Delete all server stickers
  ${prefix}prune       - Prune all server members
  ${prefix}fastprune   - Fast prune all members
`;

    // Second page - Messages, Raider, Delete, Roast, Account
    const helpText2 = `
           MESSAGES COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${prefix}spam        - <amount> <message>
  ${prefix}stop        - Stop spamming
  ${prefix}bump        - Bump messages
  ${prefix}copycat     - Copy target user messages
  ${prefix}llm         - LLM commands
  ${prefix}autoreact   - Auto-react to your messages
  ${prefix}encrypt     - Encrypt messages

          GC RAIDER COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${prefix}start       - Start GC raider spam

           DELETE MESSAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${prefix}purgeme     - Purge <amount>
  ${prefix}purgeall    - Purge all messages

             ROAST COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${prefix}fuck        - Ultra abusive roast
  ${prefix}fuck2-7     - Various roast styles

           ACCOUNT COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${prefix}activity    - Set activity status
  ${prefix}afk         - Auto-respond when AFK
  ${prefix}av          - Get user avatar

`;

    // Send first page
    await message.channel.send(`\`\`\`\n${helpText1}\n\`\`\``);
    
    // Send second page with page indicator
    await message.channel.send(`\`\`\`\n${helpText2}\n\`\`\``);
  }
};