const { Collection } = require('discord.js');
const ms = require('ms'); // For time parsing (install with: npm install ms)

module.exports = {
  name: 'purgeme',
  async execute(message, args, config) {
    // Help message if no args
    if (!args.length) {
      return message.channel.send(`
\`\`\`md
# PURGEME USAGE
.purgeme <amount> - Delete X recent messages
.purgeme all - Delete ALL your messages
.purgeme <time> (1h, 7d, 1y) - Delete messages from time period
\`\`\`
      `);
    }

    try {
      let deleteOptions = {};
      let responseText = '';
      
      // Time-based deletion (e.g., .purgeme 1y)
      if (isNaN(args[0])) {
        if (args[0].toLowerCase() === 'all') {
          // Delete ALL messages
          responseText = 'ALL OF YOUR MESSAGES';
          deleteOptions = { limit: 10000 }; // High limit for complete purge
        } else {
          // Parse time string (1h, 7d, 1y, etc.)
          const timeMs = ms(args[0]);
          if (!timeMs) throw new Error('Invalid time format');
          
          const cutoffDate = Date.now() - timeMs;
          deleteOptions = { after: cutoffDate };
          responseText = `YOUR MESSAGES FROM THE LAST ${args[0].toUpperCase()}`;
        }
      } else {
        // Amount-based deletion (e.g., .purgeme 100)
        const amount = parseInt(args[0], 10);
        if (amount <= 0 || amount > 1000) {
          return message.channel.send('\`\`\`❗ MAX 1000 MESSAGES AT ONCE\`\`\`');
        }
        deleteOptions = { limit: amount };
        responseText = `${amount} OF YOUR MOST RECENT MESSAGES`;
      }

      // Bulk delete in batches (avoids rate limits)
      let totalDeleted = 0;
      let lastMessageId = null;
      let batchCount = 0;
      const maxBatches = 10; // Safety limit

      while (batchCount < maxBatches) {
        batchCount++;
        
        // Add pagination for subsequent batches
        if (lastMessageId) {
          deleteOptions.before = lastMessageId;
        }

        // Fetch messages
        const messages = await message.channel.messages.fetch(deleteOptions);
        const userMessages = messages.filter(m => m.author.id === message.author.id);

        if (userMessages.size === 0) break;

        // Store last message ID for next batch
        lastMessageId = userMessages.lastKey();

        // Delete messages (different methods for bulk vs single)
        if (message.channel.type === 'GUILD_TEXT' && userMessages.size > 1) {
          // Bulk delete available in servers
          const deletable = userMessages.filter(m => Date.now() - m.createdTimestamp < 1209600000); // 14 days
          if (deletable.size > 0) {
            await message.channel.bulkDelete(deletable);
            totalDeleted += deletable.size;
          }
          
          // Delete older messages individually
          const nonDeletable = userMessages.filter(m => Date.now() - m.createdTimestamp >= 1209600000);
          for (const msg of nonDeletable.values()) {
            await msg.delete().catch(() => {});
            totalDeleted++;
          }
        } else {
          // Individual delete for DMs or small batches
          for (const msg of userMessages.values()) {
            await msg.delete().catch(() => {});
            totalDeleted++;
          }
        }

        // Short delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Send confirmation
      const confirmation = await message.channel.send(`\`\`\`✔️ DELETED ${totalDeleted} ${responseText}\`\`\``);
      setTimeout(() => confirmation.delete().catch(() => {}), 5000);

    } catch (error) {
      console.error('PURGEME ERROR:', error);
      message.channel.send('\`\`\`❌ ERROR: ' + (error.message || 'Failed to delete messages') + '\`\`\`');
    }
  }
};