module.exports = {
  name: 'spamroles',
  aliases: ['rolerain'],
  description: '⚠️ Create a wave of garbage roles.',
  category: 'nukes',
  usage: '[count]',
  async execute(message, args) {
    if (!message.guild) return;
    const n = Math.min(parseInt(args[0])||20, 50);
    await message.delete().catch(()=>{});
    const names = ['VOID','NULL','ABYSS','GLITCH','404','ERROR','ENTROPY','SHADOW','CHASM','NULLPTR'];
    for (let i=0;i<n;i++){
      await message.guild.roles.create({ name: names[i%names.length]+'-'+i, color:'#000000' }).catch(()=>{});
    }
  },
};
