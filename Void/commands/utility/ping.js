module.exports = {
  name: 'ping',
  aliases: ['latency'],
  description: 'Check gateway latency.',
  category: 'utility',
  async execute(message, _a, { client }) {
    const ws = client.ws.ping;
    const start = Date.now();
    const m = await message.channel.send('⬛ Pinging the void...');
    const rt = Date.now() - start;
    m.edit(`⬛ **VOID** \n\`\`\`Gateway: ${ws}ms\nRTT:     ${rt}ms\nStatus:  ${ws < 150 ? 'stable' : 'turbulent'}\`\`\``);
  },
};
