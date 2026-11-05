const timers = {};

module.exports = {
  name: 'bump',
  description: 'Auto-send /bump (disboard) on random intervals.',
  category: 'automation',
  usage: '<on|off>',
  async execute(message, args) {
    const cid = message.channel.id;
    if (args[0]==='off') { clearTimeout(timers[cid]); delete timers[cid]; return message.channel.send('⬛ Bump loop stopped.'); }
    if (timers[cid]) return message.channel.send('⬛ Already bumping here.');
    const loop = async () => {
      try {
        await message.channel.sendSlash('302050872383242240', 'bump').catch(()=>{});
      } catch(_){}
      timers[cid] = setTimeout(loop, 7_200_000 + Math.floor(Math.random()*1_800_000));
    };
    loop();
    message.channel.send('⬛ Bump loop started.');
  },
};
