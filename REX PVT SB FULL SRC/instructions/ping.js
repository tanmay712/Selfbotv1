module.exports = {
  name: 'ping',
  async execute(message, args, config, client) {
    try {
      const now = Date.now();
      const sentMessage = await message.channel.send('```🏓 PINGING...```');
      const latency = Date.now() - now;
      const apiPing = Math.round(client.ws.ping);

      await sentMessage.edit(`\`\`\`🏓 PONG! LATENCY: ${latency}MS | API PING: ${apiPing}MS\`\`\``);
    } catch (error) {
      console.error("❌ ERROR IN PING COMMAND:", error);
      message.channel.send('```❌ FAILED TO MEASURE PING.```');
    }
  }
};
