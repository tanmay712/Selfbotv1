const timers = {};
const { box } = require('../../src/ui');

module.exports = {
  name: 'bump',
  description: 'Auto /bump for disboard.',
  category: 'automation',
  usage: '<on|off>',
  async execute(message, args) {
    const cid = message.channel.id;
    if (args[0] === 'off') { clearTimeout(timers[cid]); delete timers[cid]; return message.channel.send(box('BUMP', ['stopped.'])); }
    if (timers[cid]) return message.channel.send(box('BUMP', ['already running here.']));
    const loop = async () => {
      try { await message.channel.sendSlash('302050872383242240', 'bump').catch(() => {}); } catch (_) {}
      timers[cid] = setTimeout(loop, 7_200_000 + Math.floor(Math.random() * 1_800_000));
    };
    loop();
    return message.channel.send(box('BUMP', ['loop started.']));
  },
};
