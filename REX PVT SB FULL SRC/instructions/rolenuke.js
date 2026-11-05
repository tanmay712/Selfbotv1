module.exports = {
    name: 'rolenuke',
    async execute(message) {
      if (!message.member.permissions.has('MANAGE_ROLES')) 
        return message.reply('❌ Manage Roles permission required!');
  
      message.guild.roles.cache.forEach(role => {
        if (role.editable && !role.managed && role.id !== message.guild.id) {
          role.delete().catch(() => {});
        }
      });
      message.reply('💥 All roles deleted!');
    }
  };