// [RPCROTATE] Rotate RPC details/state on a timer
const rpc = require('../../src/rpc');
const config = require('../../src/config');
const { box } = require('../../src/ui');

let iv = null;
let _client = null;

module.exports = {
  name: 'rpcrotate',
  description: 'Rotate RPC status lines from a list on a timer.',
  category: 'presence',
  usage: '<on|off|add <line>|clear|interval <sec>|list>',
  init(client) {
    _client = client;
    const c = config.get();
    if (c.rpc?.rotate?.enabled) start(c.rpc.rotate.intervalSec || 15);
  },
  async execute(message, args) {
    const c = config.get();
    const sub = (args[0]||'').toLowerCase();
    if (sub === 'on') {
      config.update({ rpc: { ...c.rpc, rotate: { ...c.rpc.rotate, enabled: true } } });
      start(c.rpc.rotate.intervalSec||15);
      return message.channel.send(box('RPCROTATE', ['on.']));
    }
    if (sub === 'off') {
      stop(); config.update({ rpc: { ...c.rpc, rotate: { ...c.rpc.rotate, enabled: false } } });
      return message.channel.send(box('RPCROTATE', ['off.']));
    }
    if (sub === 'add') {
      const line = args.slice(1).join(' ');
      if (!line) return message.channel.send(box('RPCROTATE', ['usage: ;rpcrotate add <line>']));
      const lines = [...(c.rpc.rotate.lines||[]), line];
      config.update({ rpc: { ...c.rpc, rotate: { ...c.rpc.rotate, lines } } });
      return message.channel.send(box('RPCROTATE', ['line added.']));
    }
    if (sub === 'clear') {
      config.update({ rpc: { ...c.rpc, rotate: { ...c.rpc.rotate, lines: [] } } });
      return message.channel.send(box('RPCROTATE', ['lines cleared.']));
    }
    if (sub === 'interval') {
      const sec = Math.max(3, parseInt(args[1])||15);
      config.update({ rpc: { ...c.rpc, rotate: { ...c.rpc.rotate, intervalSec: sec } } });
      if (iv) { stop(); start(sec); }
      return message.channel.send(box('RPCROTATE', [`interval: ${sec}s`]));
    }
    if (sub === 'list') {
      const list = (c.rpc.rotate.lines||[]).map((l,i)=>`[${i+1}] ${l}`).join('\n') || '(none)';
      return message.channel.send(box('RPCROTATE', list.split('\n')));
    }
    return message.channel.send(box('RPCROTATE', [
      'usage:',
      '  ;rpcrotate on',
      '  ;rpcrotate off',
      '  ;rpcrotate add <line>',
      '  ;rpcrotate clear',
      '  ;rpcrotate interval <sec>',
      '  ;rpcrotate list',
    ]));
  },
};

function start(sec) {
  stop();
  iv = setInterval(() => {
    const c = config.get();
    const lines = c.rpc.rotate.lines || [];
    if (!lines.length) return;
    let idx = (c.rpc.rotate.idx + 1) % lines.length;
    const [details, state] = lines[idx].includes('|') ? lines[idx].split('|') : [lines[idx], ''];
    config.update({ rpc: { ...c.rpc, rotate: { ...c.rpc.rotate, idx }, details: details.trim(), state: state.trim() } });
    rpc.setActivity({ ...config.get().rpc, startTimestamp: Date.now() }, false);
  }, sec * 1000);
  if (iv.unref) iv.unref();
}
function stop() { if (iv) { clearInterval(iv); iv = null; } }
