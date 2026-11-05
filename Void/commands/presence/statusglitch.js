// [STATUSGLITCH] Flip status rapidly (online/idle/dnd)
const config = require('../../src/config');
const { box } = require('../../src/ui');

let iv = null;
let _client = null;
const STATUSES = ['online','idle','dnd','idle','dnd','online'];

module.exports = {
  name: 'statusglitch',
  description: 'Rapidly flip Discord status for a glitch effect.',
  category: 'presence',
  usage: '<on|off> [intervalSec]',
  init(client) { _client = client; if (config.get().statusGlitch?.enabled) start(config.get().statusGlitch.intervalSec||3); },
  async execute(message, args) {
    _client = message.client;
    const sub = (args[0]||'').toLowerCase();
    if (sub === 'off') { stop(); config.update({ statusGlitch: { enabled:false }}); return message.channel.send(box('STATUSGLITCH', ['off.'])); }
    const sec = Math.max(1, parseInt(args[1])||3);
    config.update({ statusGlitch: { enabled:true, intervalSec:sec }});
    start(sec);
    return message.channel.send(box('STATUSGLITCH', ['on.']));
  },
};

function start(sec) {
  stop();
  let i = 0;
  iv = setInterval(() => {
    try { if (_client && _client.user) _client.user.setStatus(STATUSES[i++ % STATUSES.length]); } catch(_){}
  }, sec*1000);
  if (iv.unref) iv.unref();
}
function stop(){ if(iv){clearInterval(iv);iv=null;} }
