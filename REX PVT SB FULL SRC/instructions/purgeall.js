const { Collection } = require('discord.js');
const humanizeDuration = require('humanize-duration');

module.exports = {
    name: 'purgeall',
    async execute(message, args, client) {
        // Start timer and initial message
        const startTime = Date.now();
        const processingMsg = await message.channel.send('```⚡ ULTRA-FAST PURGE INITIATED (10 SEC MAX)```');

        // Set 10-second timeout
        const timeout = setTimeout(async () => {
            await processingMsg.edit(`\`\`\`⚠️ TIME LIMIT REACHED | Deleted ${totalDeleted} messages in 10 seconds\`\`\``);
            setTimeout(() => processingMsg.delete().catch(() => {}), 3000);
        }, 10000);

        let totalDeleted = 0;
        const deletionPromises = [];

        try {
            if (message.guild) {
                // Server purge - parallel channel processing
                const channels = message.guild.channels.cache
                    .filter(c => c.isTextBased() && c.permissionsFor(client.user).has('ManageMessages'))
                    .first(10); // Limit to 10 channels for speed

                for (const channel of channels.values()) {
                    deletionPromises.push((async () => {
                        let lastId;
                        let hasMore = true;

                        while (hasMore && Date.now() - startTime < 9500) { // Stop 500ms before timeout
                            const options = { limit: 100 };
                            if (lastId) options.before = lastId;

                            const messages = await channel.messages.fetch(options).catch(() => new Collection());
                            const userMessages = messages.filter(m => m.author.id === message.author.id);

                            if (userMessages.size === 0) {
                                hasMore = false;
                                continue;
                            }

                            lastId = userMessages.last().id;

                            // Parallel deletion
                            await Promise.all(userMessages.map(msg => 
                                msg.delete().then(() => totalDeleted++).catch(() => {})
                            ));
                        }
                    })());
                }
            } else {
                // DM purge - maximum speed
                let lastId;
                let hasMore = true;

                while (hasMore && Date.now() - startTime < 9500) {
                    const options = { limit: 100 };
                    if (lastId) options.before = lastId;

                    const messages = await message.channel.messages.fetch(options).catch(() => new Collection());
                    const userMessages = messages.filter(m => m.author.id === message.author.id);

                    if (userMessages.size === 0) {
                        hasMore = false;
                        continue;
                    }

                    lastId = userMessages.last().id;

                    // Maximum parallel deletion
                    await Promise.all(userMessages.map(msg => 
                        msg.delete().then(() => totalDeleted++).catch(() => {})
                    ));
                }
            }

            // Wait for all deletions to complete or timeout
            await Promise.all(deletionPromises);
            clearTimeout(timeout);

            // Calculate precise duration
            const duration = Date.now() - startTime;
            const durationText = humanizeDuration(duration, { round: true });

            // Final report with exact timing
            await processingMsg.edit(
                `\`\`\`✔️ PURGE COMPLETE | Deleted ${totalDeleted} messages in ${durationText}\`\`\``
            );
            setTimeout(() => processingMsg.delete().catch(() => {}), 3000);

        } catch (error) {
            clearTimeout(timeout);
            console.error('PURGEALL ERROR:', error);
            const duration = Date.now() - startTime;
            await processingMsg.edit(
                `\`\`\`❌ PURGE INTERRUPTED | Deleted ${totalDeleted} messages in ${humanizeDuration(duration)}\`\`\``
            );
            setTimeout(() => processingMsg.delete().catch(() => {}), 3000);
        }
    }
};