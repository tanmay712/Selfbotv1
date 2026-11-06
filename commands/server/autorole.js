// [AUTOROLE] Auto-assign role(s) to new members when they join.
const { box, kvBox } = require('../../src/ui');
const gcfg = require('../../src/guild-cfg');

const DEFAULTS = { enabled: false, roles: [], bots: false };

module.exports = {
  name: 'autorole',
  aliases: ['ar', 'joinrole'],
  description: 'Automatically give roles to members (and optionally bots) when they join.',
  category: 'server',
  usage: '<on|off|add <role>|remove <role>|bots <on|off>|list|clear>',
  _needsInit: true,
  init(client) {
    client.on('guildMemberAdd', async (member) => {
      const gid = member.guild.id;
      const cfg = { ...DEFAULTS, ...(gcfg.get(gid, 'autorole', {})) };
      if (!cfg.enabled || !cfg.roles?.length) return;
      if (member.user.bot && !cfg.bots) return;
      for (const rid of cfg.roles) {
        const role = member.guild.roles.cache.get(rid);
        if (!role) continue;
        try { await member.roles.add(role, '[VOID] autorole').catch(()=>{}); } catch (_) {}
      }
    });
  },
  async execute(message, args) {
    if (!message.guild) return;
    const gid = message.guild.id;
    const sub = (args[0] || 'list').toLowerCase();
    const cur = { ...DEFAULTS, ...(gcfg.get(gid, 'autorole', {})) };

    if (sub === 'on')  { gcfg.set(gid,'autorole',{...cur,enabled:true}); return message.channel.send(box('AUTOROLE',['enabled.'])); }
    if (sub === 'off') { gcfg.set(gid,'autorole',{...cur,enabled:false}); return message.channel.send(box('AUTOROLE',['disabled.'])); }
    if (sub === 'clear') { gcfg.set(gid,'autorole',{...cur,roles:[]}); return message.channel.send(box('AUTOROLE',['roles cleared.'])); }
    if (sub === 'bots') {
      const on = args[1] && ['on','true','yes','1'].includes(args[1].toLowerCase());
      gcfg.set(gid,'autorole',{...cur,bots:on});
      return message.channel.send(box('AUTOROLE',[`apply to bots: ${on?'on':'off'}`]));
    }
    if (sub === 'add' || sub === '+' || sub === 'a') {
      const role = resolveRole(message, args.slice(1));
      if (!role) return message.channel.send(box('AUTOROLE',['mention a role, or provide its name/id.']));
      const roles = new Set(cur.roles || []);
      roles.add(role.id);
      gcfg.set(gid,'autorole',{...cur, roles:[...roles], enabled:true});
      return message.channel.send(box('AUTOROLE',[`added role: @${role.name}`]));
    }
    if (sub === 'remove' || sub === 'rm' || sub === '-') {
      const role = resolveRole(message, args.slice(1));
      if (!role) return message.channel.send(box('AUTOROLE',['mention a role, or provide its name/id.']));
      gcfg.set(gid,'autorole',{...cur, roles:(cur.roles||[]).filter(r=>r!==role.id)});
      return message.channel.send(box('AUTOROLE',[`removed: @${role.name}`]));
    }
    // list/status
    const roleNames = (cur.roles||[]).map(rid => {
      const r = message.guild.roles.cache.get(rid);
      return r ? '@'+r.name : rid+' (missing)';
    });
    return message.channel.send(kvBox('AUTOROLE', [
      ['enabled', String(cur.enabled)],
      ['bots', String(cur.bots)],
      ['roles', roleNames.length ? roleNames.join(', ') : '(none)'],
    ]));
  },
};

function resolveRole(message, args) {
  const input = args.join(' ').trim();
  if (!input) return null;
  if (message.mentions.roles.size) return message.mentions.roles.first();
  // by id
  const rid = input.replace(/\D/g, '');
  if (rid && message.guild.roles.cache.has(rid)) return message.guild.roles.cache.get(rid);
  // by name (case-insensitive)
  return message.guild.roles.cache.find(r => r.name.toLowerCase() === input.toLowerCase())
      || message.guild.roles.cache.find(r => r.name.toLowerCase().startsWith(input.toLowerCase()))
      || null;
}
