const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'prefix',
  async execute(message, args, config) {
    const guildId = message.guild ? message.guild.id : "DEFAULT";

    // Path to the JSON file storing prefixes
    const prefixesPath = path.join(__dirname, '../prefixes.json');

    let prefixes = {};
    
    // Load existing prefixes if the file exists
    if (fs.existsSync(prefixesPath)) {
      prefixes = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'));
    }

    // Fetch the prefix for this guild or use the default
    const prefix = prefixes[guildId] || config.prefix;

    message.channel.send(`\`\`\`✅ THE CURRENT COMMAND PREFIX IS: "${prefix.toUpperCase()}"\`\`\``);
  }
};
