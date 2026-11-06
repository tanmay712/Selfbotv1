// [SLOWMODE] Set slowmode on a channel.
const { box, kvBox } = require('../../src/ui');

module.exports = {
  name: 'slowmode',
  aliases: ['slow', 'sm'],
  description: 'Set slowmode delay in current or target channel.',
  category: 'server',
  usage: '[seconds] [off|reset] [#channel]',
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    // Remove channel mention and look for seconds
    const cleaned = args.filter(a => !a.startsWith('<#')).join(' ');
    if (!cleaned || cleaned === 'status') {
      return message.channel.send(kvBox('SLOWMODE', [
        ['channel', '#'+ch.name],
        ['delay', (ch.rateLimitPerUser||0)+'s'],
      ]));
    }
    if (['off','reset','0','none','clear'].includes(cleaned.toLowerCase())) {
      await ch.setRateLimitPerUser(0, '[VOID] slowmode off').catch(e=>{throw e;});
      return message.channel.send(box('SLOWMODE', [`#${ch.name} slowmode turned off.`]));
    }
    const sec = Math.min(21600, Math.max(0, parseInt(cleaned) || 0));
    await ch.setRateLimitPerUser(sec, '[VOID] slowmode set').catch(e=>{
      return message.channel.send(box('SLOWMODE', ['failed: '+e.message]));
    });
    return message.channel.send(box('SLOWMODE', [`#${ch.name} slowmode set to ${sec}s.`]));
  },
};
