require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const axios = require('axios');

const client = new Client();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// AFK System Data Structure
const afkData = {
    isAFK: false,
    reason: "",
    startTime: null,
    mentions: []
};

// LOAD CONFIG
const configPath = path.join(__dirname, 'config.json');
let config = {
  prefix: "$",
  llm_instructions: [
    {
      "ROLE": "SYSTEM",
      "CONTENT": "YOU ARE A HELPFUL ASSISTANT THAT PROVIDES CONCISE AND ACCURATE ANSWERS."
    }
  ]
};

if (fs.existsSync(configPath)) {
  try {
    const rawData = fs.readFileSync(configPath);
    config = JSON.parse(rawData);
  } catch (error) {
    console.error("❌ ERROR PARSING CONFIG FILE:", error);
  }
}
console.log(`✅ PREFIX LOADED: '${config.prefix}'`);

// CREATE COMMANDS MAP
client.commands = new Map();

// LOAD COMMANDS FROM /instructions/
const commandFiles = fs.readdirSync('./instructions/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    console.log(`✅ Loading command: ${file}`);
    const command = require(`./instructions/${file}`);
    if (command.name) {
      client.commands.set(command.name.toLowerCase(), command);
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => client.commands.set(alias.toLowerCase(), command));
      }
    } else {
      console.warn(`⚠️ WARNING: Command file '${file}' is missing a name property.`);
    }
  } catch (error) {
    console.error(`❌ ERROR LOADING COMMAND ${file}:`, error);
  }
}

if (client.commands.has('autoreact')) {
  const autoreactCmd = client.commands.get('autoreact');
  if (typeof autoreactCmd.init === 'function') {
      autoreactCmd.init(client);
  }
}

// Helper function for AFK system
function formatTime(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return [
        days && `${days}d`,
        hours && `${hours}h`,
        `${minutes}m`
    ].filter(Boolean).join(" ");
}

// BOT READY EVENT
client.once('ready', () => {
  console.log(`🚀 LOGGED IN AS ${client.user.tag}!`);
  client.user.setStatus('online');
});

// MESSAGE HANDLER WITH AFK SYSTEM
client.on('messageCreate', async (message) => {
    // Check for auto-copycat behavior
    if (client.commands.has('copycat')) {
        const copycatCommand = client.commands.get('copycat');
        if (typeof copycatCommand.autoCopycat === 'function') {
            await copycatCommand.autoCopycat(message);
        }
    }

    // AFK Auto-Responder
    if (afkData.isAFK && message.author.id !== client.user.id) {
        const isMentioned = message.mentions.has(client.user.id);
        const isDM = message.channel.type === 'DM';
        
        if (isMentioned || isDM) {
            // Store mention data
            afkData.mentions.push({
                messageId: message.id,
                channelId: message.channel.id,
                author: message.author.id,
                timestamp: Date.now()
            });

            // Auto-reply from your account
            try {
                await message.reply(`I'm AFK: ${afkData.reason} (since ${formatTime(afkData.startTime)})`);
            } catch (err) {
                console.error("Failed to send AFK reply:", err);
            }
        }
    }

    // Command handler
    if (message.author.id !== client.user.id) return;
    if (!message.content.toLowerCase().startsWith(config.prefix.toLowerCase())) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Special AFK command handler
    if (commandName === 'afk') {
        if (afkData.isAFK) {
            // Return from AFK
            afkData.isAFK = false;
            
            // Reply to all stored mentions
            for (const msgData of afkData.mentions) {
                try {
                    const channel = await client.channels.fetch(msgData.channelId);
                    const msg = await channel.messages.fetch(msgData.messageId);
                    await msg.reply(`I'm back! (Was AFK: ${afkData.reason} for ${formatTime(afkData.startTime)})`);
                } catch (err) {
                    console.error("Couldn't reply to message:", err);
                }
            }
            
            afkData.mentions = [];
            await message.edit("AFK mode disabled.");
            return;
        } else {
            // Set AFK
            afkData.isAFK = true;
            afkData.reason = args.join(" ") || "AFK";
            afkData.startTime = Date.now();
            await message.edit(`You're now AFK: ${afkData.reason}\nI'll auto-respond to mentions/DMs.`);
            return;
        }
    }

    // Regular command handler
    const matchingCommand = [...client.commands.keys()].find(cmd => cmd.toLowerCase() === commandName);
    if (matchingCommand) {
        console.log(`📢 COMMAND TRIGGERED: ${matchingCommand} BY ${message.author.tag}`);
        try {
            await client.commands.get(matchingCommand).execute(message, args, config, groq, client);
        } catch (error) {
            console.error(`❌ ERROR EXECUTING COMMAND ${matchingCommand}:`, error);
            message.channel.send('```❌ THERE WAS AN ERROR EXECUTING THAT COMMAND.```');
        }
    } else {
        message.channel.send('```❌ UNKNOWN COMMAND. USE "$HELP" TO SEE ALL AVAILABLE COMMANDS.```');
    }
});

// BOT LOGIN
client.login(process.env.TOKEN);