// [HACK] Fake "hacking" animation targeting a user
const { progress, rand } = require('../../src/ui');

const LINES = [
  'establishing TCP handshake...',
  'injecting SYN flood...',
  'bypassing 2FA...',
  'exploiting CVE-2077-1337...',
  'brute-forcing password...',
  'dumping SAM hive...',
  'scraping browser cookies...',
  'installing rootkit...',
  'opening reverse shell...',
  'wiping logs...',
  'exfiltrating data...',
  'covering tracks...',
  'ACCESS GRANTED.',
];

module.exports = {
  name: 'hack',
  description: 'Fake "hacking" movie sequence.',
  category: 'fun',
  usage: '<user>',
  async execute(message, args) {
    const id = (args[0] || message.author.id).replace(/\D/g,'');
    const u = await message.client.users.fetch(id).catch(()=>null);
    const who = u ? u.tag : 'target';
    const m = await message.channel.send('```\n[HACK] acquiring target '+who+'...\n```');
    let acc = '[HACK] target: ' + who + '\n\n';
    for (let i=0;i<LINES.length;i++){
      acc += '  ' + LINES[i] + '\n';
      const pct = (i+1)/LINES.length;
      acc += '  ' + progress(pct, 30) + ' ' + Math.floor(pct*100) + '%\n\n';
      await m.edit('```\n' + acc.slice(0,1800) + '\n```').catch(()=>{});
      acc = '[HACK] target: ' + who + '\n\n';
      for (let j=0;j<=i;j++) acc += '  [+] ' + LINES[j] + '\n';
      await new Promise(r=>setTimeout(r, 500+rand(200,800)));
    }
    acc += '\n[HACK] pwned. (this is a joke)';
    await m.edit('```\n' + acc.slice(0,1900) + '\n```').catch(()=>{});
  },
};
