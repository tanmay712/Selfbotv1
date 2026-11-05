const { kvBox } = require('../../src/ui');

module.exports = {
  name: 'ping',
  aliases: ['latency', 'pong'],
  description: 'Gateway + RTT latency.',
  category: 'utility',
  async execute(message, _a, { client }) {
    const ws = client.ws.ping;
    const start = Date.now();
    const m = await message.channel.send('```[VOID] pinging the void...```');
    const rt = Date.now() - start;
    return m.edit(kvBox('PONG', [
      ['gateway', `${ws}ms`],
      ['rtt', `${rt}ms`],
      ['status', ws < 150 ? 'stable' : 'turbulent'],
    ]));
  },
};
