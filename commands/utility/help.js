// [HELP] Shows categories, commands in a category, or per-command details.
const { box, kvBox } = require('../../src/ui');

// Categories in display order
const CATEGORIES = [
  { id: 'utility',    name: '[UTILITY]',    desc: 'general purpose: ping, help, prefix, user/server info' },
  { id: 'server',     name: '[SERVER]',     desc: 'server management: welcome, autorole, logs, slowmode' },
  { id: 'automation', name: '[AUTOMATION]', desc: 'afk, autoreact, autoreply, bump, keyword triggers' },
  { id: 'presence',   name: '[PRESENCE]',   desc: 'status, custom activity, RPC, status glitch' },
  { id: 'protection', name: '[PROTECTION]', desc: 'antinuke, selfguard, vanityguard, ratelimit, panic' },
  { id: 'stealth',    name: '[STEALTH]',    desc: 'ghostping, snipe, mirror, vanish, impersonate' },
  { id: 'fun',        name: '[FUN]',        desc: 'ascii, 8ball, spam, flood, mock, roast, ai, matrix' },
  { id: 'nukes',      name: '[NUKES]',      desc: 'mass ban/kick/delete/raid. DESTRUCTIVE.' },
];

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

module.exports = {
  name: 'help',
  aliases: ['h', 'commands', '?'],
  description: 'Browse commands by category, or view one command in detail.',
  category: 'utility',
  usage: '[category | <command>]',
  async execute(message, args, { commands, config }) {
    const prefix = config.get().prefix;
    const arg = (args[0] || '').toLowerCase();

    // --- No args: list categories ---
    if (!arg) {
      // Group commands; dedupe by primary name (skip aliases)
      const unique = new Map();
      for (const cmd of commands.values()) if (cmd.name && !unique.has(cmd.name)) unique.set(cmd.name, cmd);
      const counts = {};
      for (const cmd of unique.values()) {
        const cat = cmd.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
      }
      const lines = ['categories:'];
      for (const c of CATEGORIES) {
        lines.push(`  ${c.name.padEnd(16)} ${String(counts[c.id]||0).padStart(2)} cmds  - ${c.desc}`);
      }
      lines.push('');
      lines.push(`${prefix}help <category>   list commands in a category`);
      lines.push(`${prefix}help <command>    details on one command`);
      return message.channel.send(box('VOID HELP', lines));
    }

    // --- arg matches a category id or category header keyword ---
    const catMatch = matchCategory(arg);
    if (catMatch) {
      const cat = CAT_BY_ID[catMatch];
      const unique = new Map();
      for (const cmd of commands.values()) if (cmd.name && !unique.has(cmd.name)) unique.set(cmd.name, cmd);
      const names = [...unique.values()].filter(c => (c.category || 'other') === cat.id).map(c => c.name).sort();
      if (!names.length) return message.channel.send(box('HELP', [`no commands in ${cat.name}.`]));
      // Split into two columns for compactness
      const lines = [`${cat.name}  -  ${cat.desc}`, ''];
      // Chunk into lines of ~8 commands
      for (let i = 0; i < names.length; i += 2) {
        const a = `${prefix}${names[i]}`.padEnd(18);
        const b = names[i+1] ? `${prefix}${names[i+1]}` : '';
        lines.push('  ' + a + b);
      }
      lines.push('');
      lines.push(`${prefix}help <command> for details on a command.`);
      return message.channel.send(box(cat.name.slice(1,-1), lines));
    }

    // --- arg is a command name/alias ---
    const name = arg.replace(new RegExp('^'+escapeRegex(prefix)), '');
    const cmd = commands.get(name);
    if (!cmd) return message.channel.send(box('HELP', [`no category or command matching "${arg}".`, `try ${prefix}help to list categories.`]));

    // Per-command detail
    const enable = cmd.toggleable !== false ? hasEnableDisable(cmd) : false;
    const rows = [
      ['name', cmd.name],
      ['aliases', cmd.aliases?.length ? cmd.aliases.map(a=>prefix+a).join(', ') : '-'],
      ['category', (CAT_BY_ID[cmd.category]?.name) || cmd.category || 'other'],
      ['desc', cmd.description || '-'],
    ];
    if (cmd.usage) rows.push(['usage', `${prefix}${cmd.name} ${cmd.usage}`]);
    if (enable) rows.push(['subs', 'on | off | status (see command output)']);
    return message.channel.send(kvBox('CMD', rows));
  },
};

function matchCategory(arg) {
  // accept 'utility', '[UTILITY]', 'util', 'u'
  if (CAT_BY_ID[arg]) return arg;
  const lower = arg.toLowerCase().replace(/[^a-z]/g,'');
  for (const c of CATEGORIES) {
    const id = c.id.toLowerCase();
    if (id === lower) return c.id;
    if (id.startsWith(lower) && lower.length >= 2) return c.id;
    if (c.name.toLowerCase().replace(/[^a-z]/g,'').startsWith(lower) && lower.length >= 2) return c.id;
  }
  return null;
}

function hasEnableDisable(cmd) {
  const src = cmd.execute?.toString?.() || '';
  return /'on'|'off'|"on"|"off"|'enable'|"enable"|'disable'|"disable"/.test(src);
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
