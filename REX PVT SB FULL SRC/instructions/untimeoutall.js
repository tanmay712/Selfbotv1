module.exports = {
    name: 'untimeoutall',
    description: 'Remove timeout from all server members',
    aliases: ['untimeout', 'removetimeoutall'],
    async execute(message) {
      // Permission check
      if (!message.member.permissions.has('MODERATE_MEMBERS')) {
        return message.reply('```❌ You need MODERATE_MEMBERS permission!```')
          .then(msg => setTimeout(() => msg.delete(), 5000))
          .catch(() => {});
      }
  
      try {
        const members = await message.guild.members.fetch();
        const timeoutMembers = members.filter(m => m.isCommunicationDisabled());
        
        if (timeoutMembers.size === 0) {
          return message.reply('```ℹ️ No members are currently timed out```')
            .then(msg => setTimeout(() => msg.delete(), 5000))
            .catch(() => {});
        }
  
        const confirmMsg = await message.reply(
          `⚠️ This will remove timeout from ${timeoutMembers.size} members. ` +
          'Type `confirm` in 15 seconds to proceed.'
        );
  
        const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'confirm';
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });
  
        collector.on('collect', async () => {
          let processed = 0;
          let success = 0;
          let failed = 0;
  
          for (const [, member] of timeoutMembers) {
            try {
              await member.timeout(null);
              success++;
            } catch (error) {
              failed++;
              console.error(`Failed to untimeout ${member.user.tag}:`, error);
            }
            processed++;
            
            // Update status every 10 members
            if (processed % 10 === 0) {
              await confirmMsg.edit(
                `🔄 Processing... ${processed}/${timeoutMembers.size}\n` +
                `✅ Success: ${success} | ❌ Failed: ${failed}`
              ).catch(() => {});
            }
          }
  
          await confirmMsg.edit(
            `✅ Completed!\n` +
            `Total: ${timeoutMembers.size} | Success: ${success} | Failed: ${failed}`
          ).catch(() => {});
        });
  
        collector.on('end', collected => {
          if (collected.size === 0) {
            confirmMsg.edit('❌ Command cancelled').catch(() => {});
            setTimeout(() => confirmMsg.delete().catch(() => {}), 3000);
          }
        });
  
      } catch (error) {
        console.error('UntimeoutAll error:', error);
        message.reply('```❌ Error processing command```')
          .then(msg => setTimeout(() => msg.delete(), 5000))
          .catch(() => {});
      }
    }
  };