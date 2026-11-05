// [HELP] List commands / show per-command details
const { box, kvBox, M } = require('../../src/ui');

// Friendly category headers (display order)
const CAT_ORDER = ['utility','presence','automation','protection','fun','nukes','stealth','other'];
const CAT_NAMES = {
  utility:    '[UTILITY]',
  presence:   '[PRESENCE]',
  automation: '[AUTOMATION]',
  protection: '[PROTECTION]',
  fun:        '[FUN]',
  nukes:      '[NUKES]',
  stealth:    '[STEALTH]',
  other:      '[MISC]',
};

module.exports = {
  name: 'help',
  aliases: ['h', 'commands', '?'],
  description: 'Show VOID commands. Use help <cmd> for details.',
  category: 'utility',
  usage: '[command]',
  async execute(message, args, { commands, config }) {
    const prefix = config.get().prefix;

    // Per-command detail
    if (args[0]) {
      const name = args[0].toLowerCase().replace(new RegExp('^'+escapeRegex(prefix)), '');
      const cmd = commands.get(name);
      if (!cmd) return message.channel.send(box('HELP', [`unknown command: ${args[0]}`]));
      const rows = [
        ['name', cmd.name],
        ['aliases', cmd.aliases?.length ? cmd.aliases.join(', ') : '-'],
        ['category', cmd.category || 'other'],
        ['desc', cmd.description || '-'],
      ];
      if (cmd.usage) rows.push(['usage', `${prefix}${cmd.name} ${cmd.usage}`]);
      return message.channel.send(kvBox('CMD', rows));
    }

    // Full listing - build one unique command per name (skip aliases)
    const unique = new Map();
    for (const cmd of commands.values()) {
      if (!cmd.name) continue;
      if (!unique.has(cmd.name)) unique.set(cmd.name, cmd);
    }
    const byCat = {};
    for (const cmd of unique.values()) {
      const cat = cmd.category || 'other';
      (byCat[cat] = byCat[cat] || []).push(cmd.name);
    }
    const lines = [];
    for (const cat of CAT_ORDER) {
      const names = byCat[cat];
      if (!names || !names.length) continue;
      lines.push(CAT_NAMES[cat] || cat);
      lines.push('  ' + names.sort().map(n => prefix+n).join('  '));
      lines.push('');
    }
    lines.push(`${prefix}help <cmd>  for details on one command.`);
    return message.channel.send(box('VOID', lines));
  },
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
