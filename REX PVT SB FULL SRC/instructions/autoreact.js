const fs = require('fs');
const path = require('path');

// Helper function to check if a string is a valid emoji (Unicode or Discord custom emoji)
function isEmoji(str) {
    // Unicode emoji regex (covers most emojis)
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    // Discord custom emoji format: <:name:123456789> or <a:name:123456789>
    const customEmojiRegex = /^<a?:[\w]+:\d+>$/;
    
    return customEmojiRegex.test(str) || emojiRegex.test(str);
}

module.exports = {
    name: 'autoreact',
    description: 'React to your messages with multiple emojis per keyword',
    config: {
        active: false,
        triggers: []
    },

    init(client) {
        // Load config
        const configPath = path.join(__dirname, 'autoreact_config.json');
        if (fs.existsSync(configPath)) {
            try {
                this.config = JSON.parse(fs.readFileSync(configPath));
            } catch (err) {
                console.error('Error loading autoreact config:', err);
            }
        }

        client.on('messageCreate', async (message) => {
            if (!this.config.active || message.author.id !== client.user.id) return;

            const content = message.content.toLowerCase();
            
            for (const trigger of this.config.triggers) {
                if (content.includes(trigger.keyword.toLowerCase())) {
                    try {
                        for (const emoji of trigger.emojis) {
                            if (!isEmoji(emoji)) {
                                console.error(`Invalid emoji: ${emoji}`);
                                continue;
                            }
                            await message.react(emoji);
                            await new Promise(resolve => setTimeout(resolve, 500)); // Avoid rate limits
                        }
                    } catch (error) {
                        if (error.code !== 50013) { // Ignore "Missing Permissions" error
                            console.error('Autoreact error:', error);
                        }
                    }
                }
            }
        });
    },

    async execute(message, args) {
        const configPath = path.join(__dirname, 'autoreact_config.json');
        
        if (args[0] === 'on') {
            this.config.active = true;
            await message.edit('✅ **Autoreact enabled** (will react to YOUR messages)');
        } 
        else if (args[0] === 'off') {
            this.config.active = false;
            await message.edit('❌ **Autoreact disabled**');
        }
        else if (args[0] === 'add' && args.length >= 3) {
            // Find where emojis start (skip "add" and keyword parts)
            let emojiStart = 2;
            while (emojiStart < args.length && !isEmoji(args[emojiStart])) {
                emojiStart++;
            }

            if (emojiStart >= args.length) {
                return message.edit('❌ **No valid emojis provided!**');
            }

            const keyword = args.slice(1, emojiStart).join(' '); // Handle multi-word keywords
            const emojis = args.slice(emojiStart).filter(e => isEmoji(e)); // Only allow valid emojis

            if (emojis.length === 0) {
                return message.edit('❌ **No valid emojis found!**');
            }

            // Remove existing trigger for this keyword
            this.config.triggers = this.config.triggers.filter(t => t.keyword !== keyword);
            
            this.config.triggers.push({
                keyword: keyword,
                emojis: emojis
            });
            
            await message.edit(`✅ **Added reactions:** ${emojis.join(' ')} for **"${keyword}"**`);
        }
        else if (args[0] === 'list') {
            const response = [
                '**📜 Autoreact Triggers:**',
                ...this.config.triggers.map((t, i) => 
                    `${i+1}. **"${t.keyword}"** → ${t.emojis.join(' ')}`
                ),
                `\n**Status:** ${this.config.active ? '✅ **ON**' : '❌ **OFF**'}`
            ].join('\n');
            await message.edit(response);
        }
        else if (args[0] === 'remove' && args[1]) {
            const keyword = args.slice(1).join(' ');
            const initialLength = this.config.triggers.length;
            this.config.triggers = this.config.triggers.filter(t => t.keyword !== keyword);
            
            if (this.config.triggers.length < initialLength) {
                await message.edit(`❌ **Removed triggers for:** "${keyword}"`);
            } else {
                await message.edit(`❌ **No triggers found for:** "${keyword}"`);
            }
        }
        else {
            await message.edit([
                '**⚙️ Autoreact Commands:**',
                '`.autoreact on` - **Enable** reacting to YOUR messages',
                '`.autoreact off` - **Disable** reactions',
                '`.autoreact add [keyword] [emojis...]` - Add reactions when keyword is detected',
                '`.autoreact list` - Show all triggers',
                '`.autoreact remove [keyword]` - Remove a trigger',
                '',
                '**📌 Examples:**',
                '`.autoreact add hello 👋 🎉` - Reacts when you say "hello"',
                '`.autoreact add fuck off 😡 🖕` - Reacts when you say "fuck off"',
                '',
                `**Status:** ${this.config.active ? '✅ **ON**' : '❌ **OFF**'}`
            ].join('\n'));
        }

        // Save config
        fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    }
};