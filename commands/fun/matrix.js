// [MATRIX] Send Matrix-style falling ASCII rain (multiple messages for animation)
const { rand } = require('../../src/ui');

const CHARS = '01!@#$%^&*()_+-=[]{};:,.<>/?~`ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function line(w) {
  let s = '';
  for (let i=0;i<w;i++) s += Math.random()<0.6 ? CHARS[rand(0,CHARS.length-1)] : ' ';
  return s;
}

module.exports = {
  name: 'matrix',
  description: 'Matrix rain animation (ASCII).',
  category: 'fun',
  usage: '[lines]',
  async execute(message, args) {
    const n = Math.min(parseInt(args[0])||12, 20);
    await message.delete().catch(()=>{});
    let m = await message.channel.send('```\n' + 'waking the matrix...'.padEnd(48,' ') + '\n```');
    for (let i=0;i<n;i++){
      const frame = Array.from({length: 12}, ()=>line(52)).join('\n');
      await m.edit('```\n' + frame + '\n```').catch(()=>{});
      await new Promise(r=>setTimeout(r,250));
    }
    const end = [
      ' wake up, '+ (message.author.username.slice(0,18).padEnd(30,' ')),
      ' the matrix has you.'.padEnd(52,' '),
    ];
    await m.edit('```\n' + Array.from({length:5},()=>line(52)).join('\n') + '\n' + end.join('\n') + '\n```').catch(()=>{});
  },
};
