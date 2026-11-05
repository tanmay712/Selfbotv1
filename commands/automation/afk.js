const { box } = require('../../src/ui');
const state = { on: false, reason: '', since: 0, pings: [] };

function uptime() {
  const s = Math.floor((Date.now() - state.since) / 1000);
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m}m`;
}

module.exports = {
  name: 'afk',
  description: 'Away-from-keyboard auto-reply.',
  category: 'automation',
  usage: '[reason]',
  async execute(message, args) {
    if (state.on) {
      state.on = false;
      const msgs = state.pings.splice(0);
      for (const p of msgs) {
        try {
          const ch = await message.client.channels.fetch(p.ch).catch(() => null);
          if (!ch) continue;
          const m = await ch.messages.fetch(p.id).catch(() => null);
          if (m) await m.reply(box('AFK', [`back. was away: ${state.reason} (${uptime()})`]));
        } catch (_) {}
      }
      return message.channel.send(box('AFK', ['disabled.']));
    }
    state.on = true;
    state.reason = args.join(' ') || 'afk';
    state.since = Date.now();
    state.pings = [];
    return message.channel.send(box('AFK', [`enabled: ${state.reason}`]));
  },
  async _hook(msg) {
    if (!state.on) return;
    if (msg.author.id === msg.client.user.id) return;
    const me = msg.mentions.has(msg.client.user.id) || msg.channel.type === 'DM';
    if (me) {
      state.pings.push({ ch: msg.channel.id, id: msg.id });
      msg.reply(box('AFK', [`${state.reason} (${uptime()})`])).catch(() => {});
    }
  },
};
