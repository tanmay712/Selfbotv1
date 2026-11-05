// [VOID] Command + hook loader
const fs = require('fs');
const path = require('path');
const log = require('./logger');

function loadAll() {
  const root = path.join(__dirname, '..', 'commands');
  const commands = new Map();
  const hooks = [];
  const intervals = []; // setInterval handles from commands (set during init)

  walk(root).forEach(file => {
    try {
      // invalidate require cache for hot loading
      delete require.cache[require.resolve(file)];
      const cmd = require(file);
      if (!cmd.name) return;
      commands.set(cmd.name.toLowerCase(), cmd);
      if (cmd.aliases) cmd.aliases.forEach(a => commands.set(a.toLowerCase(), cmd));

      // init(client) for periodic behaviour (rotating rpc, status glitch, etc.)
      if (typeof cmd.init === 'function') {
        try {
          // init is called once client is ready (in index.js); we just flag it here.
          cmd._needsInit = true;
        } catch (e) { log.err('LOAD', `${cmd.name} init: ${e.message}`); }
      }

      // messageCreate hook
      if (typeof cmd._hook === 'function')
        hooks.push({ event: 'messageCreate', fn: cmd._hook.bind(cmd) });

      // _on<Event> shorthand (Delete -> messageDelete, Edit -> messageUpdate)
      Object.getOwnPropertyNames(Object.getPrototypeOf(cmd)).concat(Object.keys(cmd)).forEach(k => {
        if (k.startsWith('_on') && typeof cmd[k] === 'function') {
          let ev = k.slice(3);
          const shorthand = { Delete: 'messageDelete', Edit: 'messageUpdate' };
          ev = shorthand[ev] || ev;
          ev = ev[0].toLowerCase() + ev.slice(1);
          hooks.push({ event: ev, fn: cmd[k].bind(cmd) });
        }
      });

      log.ok('LOAD', `${padRight(cmd.name, 14)} [${cmd.category || 'other'}]`);
    } catch (e) {
      log.err('LOAD', `${file}: ${e.message}`);
    }
  });
  return { commands, hooks, intervals };
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && ent.name.endsWith('.js')) out.push(p);
  }
  return out;
}

function padRight(s, n) { return s + ' '.repeat(Math.max(0, n - s.length)); }

module.exports = { loadAll };
