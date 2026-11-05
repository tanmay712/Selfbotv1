const config = require('../../src/config');

module.exports = {
  name: 'autoreact',
  description: 'Auto-react to messages matching a keyword.',
  category: 'automation',
  usage: '<on|off|add <keyword> <emoji>|remove <keyword>|list>',
  async execute(message, args) {
    const cfg = config.get();
    const ar = cfg.autoReact;
    const sub = (args[0]||'').toLowerCase();
    if (sub === 'on')  { config.update({ autoReact: { ...ar, enabled: true }}); return message.channel.send('⬛ Auto-react enabled.'); }
    if (sub === 'off') { config.update({ autoReact: { ...ar, enabled: false }}); return message.channel.send('⬛ Auto-react disabled.'); }
    if (sub === 'list') {
      const list = ar.triggers.map(t=>`${t.keyword} → ${t.emoji}`).join('\n') || '(none)';
      return message.channel.send(`⬛ Auto-react triggers:\n\`\`\`\n${list}\n\`\`\``);
    }
    if (sub === 'add') {
      const keyword = args[1]; const emoji = args[2];
      if (!keyword||!emoji) return message.channel.send('⬛ Usage: ;autoreact add <keyword> <emoji>');
      const triggers = [...ar.triggers.filter(t=>t.keyword!==keyword), { keyword, emoji }];
      config.update({ autoReact: { ...ar, triggers }});
      return message.channel.send(`⬛ Added trigger: ${keyword} → ${emoji}`);
    }
    if (sub === 'remove') {
      const keyword = args[1];
      const triggers = ar.triggers.filter(t=>t.keyword!==keyword);
      config.update({ autoReact: { ...ar, triggers }});
      return message.channel.send('⬛ Removed.');
    }
    message.channel.send('⬛ Usage: ;autoreact <on|off|add|remove|list>');
  },
  async _hook(msg, { client }) {
    if (!config.get().autoReact.enabled) return;
    if (msg.author.id === client.user.id) return;
    for (const t of config.get().autoReact.triggers) {
      if (msg.content.toLowerCase().includes(t.keyword.toLowerCase())) {
        msg.react(t.emoji).catch(()=>{});
      }
    }
  },
};
