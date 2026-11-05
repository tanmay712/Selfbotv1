// [TRACE] Fake IP-trace sequence (movie-style)
const { rndIP, rand } = require('../../src/ui');

module.exports = {
  name: 'trace',
  aliases: ['traceroute', 'ip'],
  description: 'Fake IP traceroute to a user (movie-hacker vibe).',
  category: 'fun',
  usage: '<user>',
  async execute(message, args) {
    const id = (args[0] || message.author.id).replace(/\D/g, '');
    const u = await message.client.users.fetch(id).catch(()=>null);
    const who = u ? u.tag : 'target';
    const m = await message.channel.send('```\n[TRACE] initializing trace to '+who+'...\n```');
    const steps = [
      'resolving host...',
      'bouncing through 7 proxies...',
      '[hop 1] ' + rndIP() + '  -- AS-LEVEL3',
      '[hop 2] ' + rndIP() + '  -- AS-COGENT',
      '[hop 3] ' + rndIP() + '  -- TOR RELAY [DE]',
      '[hop 4] ' + rndIP() + '  -- TOR RELAY [NL]',
      '[hop 5] ' + rndIP() + '  -- VPN EXIT [RU]',
      '[hop 6] ' + rndIP() + '  -- SAT-LINK [OFFSHORE]',
      '[hop 7] ' + rndIP() + '  -- TARGET REACHED',
      'decrypting headers...',
      'correlating ISP logs...',
      'triangulating...',
      'TARGET ACQUIRED.',
    ];
    let acc = '[TRACE] routing to ' + who + '\n';
    for (const s of steps) {
      acc += '\n' + s;
      await m.edit('```\n' + acc.slice(0,1800) + '\n```').catch(()=>{});
      await new Promise(r=>setTimeout(r, 400 + rand(100,500)));
    }
    acc += '\n\n' +
      '==================================================\n' +
      '| TARGET : ' + who.padEnd(39,' ') + '|\n' +
      '| IP     : ' + rndIP().padEnd(39,' ') + '|\n' +
      '| ISP    : ' + ['ShadowNet','VOID-ISP','Offshore Telecom','GhostCom','BlackNet'][rand(0,4)].padEnd(39,' ') + '|\n' +
      '| COORD  : ' + (rand(-90,90)+', '+rand(-180,180)).padEnd(39,' ') + '|\n' +
      '==================================================\n';
    await m.edit('```\n' + acc.slice(0,1900) + '\n```').catch(()=>{});
  },
};
