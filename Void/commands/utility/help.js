// [HELP] List commands
const { box, M } = require('../../src/ui');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands', '?'],
  description: 'Show all VOID commands.',
  category: 'utility',
  async execute(message, args, { commands, config }) {
    const prefix = config.get().prefix;
    const byCat = {};
    for (const cmd of commands.values()) {
      if (!cmd.name) continue;
      const cat = cmd.category || 'other';
      if (!byCat[cat]) byCat[cat] = new Set();
      byCat[cat].add(cmd.name);
    }
    const catNames = {
      utility:    '[UTILITY]',
      presence:   '[PRESENCE]',
      automation: '[AUTOMATION]',
      protection: '[PROTECTION]',
      fun:        '[FUN]',
      nukes:      '[NUKES]',
      stealth:    '[STEALTH]',
      other:      '[MISC]',
    };
    const lines = [];
    for (const [cat, set] of Object.entries(byCat)) {
      lines.push(catNames[cat] || cat);
      lines.push('  ' + [...set].sort().map(n => `${prefix}${n}`).join('  '));
      lines.push('');
    }
    lines.push(`use ${prefix}help <command> for details.`);
    return message.channel.send(box('VOID', lines));
  },
};
