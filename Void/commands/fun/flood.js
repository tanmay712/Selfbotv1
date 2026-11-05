// [FLOOD] Giant ASCII wall of void symbols
module.exports = {
  name: 'flood',
  description: 'Send a giant ASCII wall of void symbols.',
  category: 'fun',
  usage: '[height]',
  async execute(message, args) {
    const h = Math.min(parseInt(args[0])||12, 22);
    const w = 54;
    const CHARS = '#@%&*+=-:. ';
    const rows = [];
    for (let i=0;i<h;i++){
      let s='';
      for (let j=0;j<w;j++){
        const d = Math.hypot(i-h/2, j-w/2);
        const k = Math.max(0, Math.min(1, 1 - d/(w/2)));
        s += CHARS[Math.floor(k * (CHARS.length-1))];
      }
      rows.push(s);
    }
    await message.delete().catch(()=>{});
    return message.channel.send('```\n' + rows.join('\n') + '\n```');
  },
};
