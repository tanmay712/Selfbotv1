// [RATELIMIT] Configure / view the smart outbound rate limiter
const rl = require('../../src/protection/ratelimit');
const { kvBox, box } = require('../../src/ui');

module.exports = {
  name: 'ratelimit',
  aliases: ['rl','ratelimiter','slowmode'],
  description: 'Configure outbound rate-limit protection.',
  category: 'protection',
  usage: '<set <key> <value>|status>',
  async execute(message, args) {
    const sub = (args[0] || 'status').toLowerCase();
    if (sub === 'set') {
      const key = args[1]; const val = Number(args[2]);
      if (!key || isNaN(val)) return message.channel.send(box('RATELIMIT', ['usage: ;ratelimit set <baseDelayMs|jitterMs|burstThreshold|slowFactor|maxQueueSize> <number>']));
      rl.configure({ [key]: val });
      return message.channel.send(kvBox('RATELIMIT', [[key, String(val)]]));
    }
    if (sub === 'slow') { rl.configure({ baseDelayMs: 1100, jitterMs: 1200, burstThreshold: 3 }); return message.channel.send(box('RATELIMIT', ['slow mode engaged.'])); }
    if (sub === 'fast') { rl.configure({ baseDelayMs: 350, jitterMs: 500, burstThreshold: 5 }); return message.channel.send(box('RATELIMIT', ['normal speed.'])); }
    const s = rl.stats();
    const totalPending = s.queues.reduce((a,b)=>a+b.pending,0);
    return message.channel.send(kvBox('RATELIMIT', [
      ['global cd', s.globalCooldownMs+'ms'],
      ['queued', String(totalPending)],
      ['panic', String(s.panicking)],
      ['baseDelay', s.config.baseDelayMs+'ms'],
      ['jitter', s.config.jitterMs+'ms'],
      ['burstThresh', String(s.config.burstThreshold)],
      ['slowFactor', 'x'+s.config.slowFactor],
      ['typing', String(s.config.typing)],
    ]));
  },
};
