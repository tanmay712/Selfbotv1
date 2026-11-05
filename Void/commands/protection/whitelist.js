// [WHITELIST] Keep a user-safe whitelist so antinuke knows who to NOT kick/ban/timeout even if nukes are fired.
const fs = require('fs');
const path = require('path');
const { box } = require('../../src/ui');

const FILE = path.join(__dirname, '..', '..', 'data', 'whitelist.json');
function load() { try { return JSON.parse(fs.readFileSync(FILE,'utf8')); } catch { return { users: [], roles: [] }; } }
function save(d) { fs.writeFileSync(FILE, JSON.stringify(d,null,2)); }

module.exports = {
  name: 'whitelist',
  aliases: ['wl'],
  description: 'Whitelist users/roles that nukes should skip.',
  category: 'protection',
  usage: '<adduser|rmuser|addrole|rmrole|list>',
  async execute(message, args) {
    const wl = load();
    const sub = (args[0]||'list').toLowerCase();
    if (sub === 'adduser') {
      const id = (args[1]||'').replace(/\D/g,'');
      if (!id) return message.channel.send(box('WHITELIST', ['usage: ;whitelist adduser <id>']));
      if (!wl.users.includes(id)) wl.users.push(id);
      save(wl); return message.channel.send(box('WHITELIST', [`user ${id} whitelisted.`]));
    }
    if (sub === 'rmuser') {
      const id = (args[1]||'').replace(/\D/g,'');
      wl.users = wl.users.filter(x=>x!==id);
      save(wl); return message.channel.send(box('WHITELIST', ['removed.']));
    }
    if (sub === 'addrole') {
      const id = (args[1]||'').replace(/\D/g,'');
      if (!id) return message.channel.send(box('WHITELIST', ['usage: ;whitelist addrole <id>']));
      if (!wl.roles.includes(id)) wl.roles.push(id);
      save(wl); return message.channel.send(box('WHITELIST', [`role ${id} whitelisted.`]));
    }
    if (sub === 'rmrole') {
      const id = (args[1]||'').replace(/\D/g,'');
      wl.roles = wl.roles.filter(x=>x!==id);
      save(wl); return message.channel.send(box('WHITELIST', ['removed.']));
    }
    return message.channel.send(box('WHITELIST', [
      `users: ${wl.users.length}`,
      wl.users.map(u=>`  - ${u}`).join('\n') || '  (none)',
      `roles: ${wl.roles.length}`,
      wl.roles.map(r=>`  - ${r}`).join('\n') || '  (none)',
    ]));
  },
};
