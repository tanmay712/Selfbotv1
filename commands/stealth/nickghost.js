// [NICKGHOST] Rapidly cycle your nickname in the server (ghost effect)
const { box } = require('../../src/ui');
let nickIv = null;

const NAMES = ['void', 'null', '404', 'error', '', '.', '...', '???', 'nobody', 'glitch', 'abyss', 'shadow'];

module.exports = {
  name: 'nickghost',
  description: 'Cycle nickname rapidly for a ghost/obfuscation effect.',
  category: 'stealth',
  usage: '<on|off>',
  async execute(message, args) {
    if (args[0] === 'off' || args[0] === 'stop') {
      clearInterval(nickIv); nickIv = null;
      return message.channel.send(box('NICKGHOST', ['stopped.']));
    }
    if (nickIv) return message.channel.send(box('NICKGHOST', ['already running.']));
    if (!message.guild) return message.channel.send(box('NICKGHOST', ['use in a server.']));
    let i = 0;
    nickIv = setInterval(() => {
      const me = message.guild.members.cache.get(message.client.user.id);
      if (me && me.manageable) me.setNickname(NAMES[i++ % NAMES.length]).catch(()=>{});
    }, 900);
    return message.channel.send(box('NICKGHOST', ['flickering...']));
  },
};
