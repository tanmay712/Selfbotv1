// ⬛ help — lists all commands with void-themed output
module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Show all VOID commands.',
  category: 'utility',
  async execute(message, args, { commands, config }) {
    const prefix = config.get().prefix;
    const byCat = {};
    for (const cmd of commands.values()) {
      if (!cmd.name) continue;
      const cat = cmd.category || 'other';
      if (!byCat[cat]) byCat[cat] = [];
      if (!byCat[cat].includes(cmd.name)) byCat[cat].push(cmd.name);
    }
    const catNames = { utility: '🔮 Utility', presence: '🌀 Presence', automation: '⚙️ Automation', fun: '💀 Fun', nukes: '💣 Nukes', stealth: '👻 Stealth', other: '✨ Misc' };
    let out = '```asciidoc\n';
    out += '╔══════════════════════════════════╗\n';
    out += '║          ⬛  V O I D              ║\n';
    out += '╚══════════════════════════════════╝\n\n';
    for (const [cat, list] of Object.entries(byCat)) {
      out += `== ${catNames[cat] || cat} ==\n`;
      out += list.map(n => `${prefix}${n}`).join('  •  ') + '\n\n';
    }
    out += `Use ${prefix}help <command> for details on a single command.\n`;
    out += '```';
    await message.channel.send(out).catch(()=>{});
  },
};
