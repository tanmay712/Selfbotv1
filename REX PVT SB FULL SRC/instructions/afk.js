module.exports = {
    name: 'afk',
    description: 'Set AFK status with auto-response to mentions/DMs',
    afkData: {
        isAFK: false,
        reason: "",
        startTime: null,
        mentions: []
    },

    formatTime(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return [
            days && `${days}d`,
            hours && `${hours}h`,
            `${minutes}m`
        ].filter(Boolean).join(" ");
    },

    async execute(message, args, client) {
        // AFK Command Handler
        if (this.afkData.isAFK) {
            // Return from AFK
            this.afkData.isAFK = false;
            
            // Reply to all stored mentions
            for (const msgData of this.afkData.mentions) {
                try {
                    const channel = await client.channels.fetch(msgData.channelId);
                    const msg = await channel.messages.fetch(msgData.messageId);
                    await msg.reply(`I'm back! (Was AFK: ${this.afkData.reason} for ${this.formatTime(this.afkData.startTime)})`);
                } catch (err) {
                    console.error("Couldn't reply to message:", err);
                }
            }
            
            this.afkData.mentions = [];
            await message.edit("✅ AFK mode disabled.");
            return;
        } else {
            // Set AFK
            this.afkData.isAFK = true;
            this.afkData.reason = args.join(" ") || "AFK";
            this.afkData.startTime = Date.now();
            await message.edit(`⏸️ You're now AFK: **${this.afkData.reason}**\nI'll auto-respond to mentions/DMs.`);
            return;
        }
    },

    async handleMentions(message, client) {
        // AFK Auto-Responder
        if (this.afkData.isAFK) {
            const isMentioned = message.mentions.has(client.user.id);
            const isDM = message.channel.type === 'DM';
            
            if (isMentioned || isDM) {
                // Store mention data
                this.afkData.mentions.push({
                    messageId: message.id,
                    channelId: message.channel.id,
                    author: message.author.id,
                    timestamp: Date.now()
                });

                // Auto-reply from your account
                try {
                    await message.reply(`⏸️ I'm AFK: **${this.afkData.reason}** (since ${this.formatTime(this.afkData.startTime)})`);
                } catch (err) {
                    console.error("Failed to send AFK reply:", err);
                }
            }
        }
    }
};