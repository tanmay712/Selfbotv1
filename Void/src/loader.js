// ⬛ VOID command loader — recursively scans /commands/ and registers hooks
const fs = require('fs');
const path = require('path');
const log = require('./logger');

function loadAll() {
  const root = path.join(__dirname, '..', 'commands');
  const commands = new Map();
  const hooks = []; // {event, fn}
  walk(root).forEach(file => {
    try {
      const cmd = require(file);
      if (!cmd.name) return;
      commands.set(cmd.name.toLowerCase(), cmd);
      if (cmd.aliases) cmd.aliases.forEach(a => commands.set(a.toLowerCase(), cmd));
      // auto-detect hooks: _hook is messageCreate. Any _onX becomes event handler.
      if (typeof cmd._hook === 'function') hooks.push({ event:'messageCreate', fn: cmd._hook.bind(cmd) });
      Object.getOwnPropertyNames(Object.getPrototypeOf(cmd)).concat(Object.keys(cmd)).forEach(k=>{
        if (k.startsWith('_on') && typeof cmd[k]==='function') {
          let ev = k.slice(3);
          // Convenience: _onDelete -> messageDelete, _onEdit -> messageUpdate
          const shorthand = { Delete:'messageDelete', Edit:'messageUpdate' };
          ev = shorthand[ev] || ev;
          // camelCase on first char lower (e.g. _onMessageCreate -> messageCreate)
          ev = ev[0].toLowerCase() + ev.slice(1);
          hooks.push({ event: ev, fn: cmd[k].bind(cmd) });
        }
      });
      log.ok('LOAD', `${cmd.name} [${cmd.category||'other'}]`);
    } catch(e) {
      log.err('LOAD', `${file}: ${e.message}`);
    }
  });
  return { commands, hooks };
}

function walk(dir, out=[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes:true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && ent.name.endsWith('.js')) out.push(p);
  }
  return out;
}

module.exports = { loadAll };
