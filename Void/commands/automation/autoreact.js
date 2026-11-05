const config = require('../../src/config');
const { box } = require('../../src/ui');

module.exports = {
  name: 'autoreact',
  description: 'Auto-react to keyword matches.',
  category: 'automation',
  usage: '<on|off|add <keyword> <emoji>|remove <keyword>|list>',
  async execute(message, args) {
    const cfg = config.get();
    const ar = cfg.autoReact;
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'on') { config.update({ autoReact: { ...ar, enabled: true } }); return message.channel.send(box('AUTOREACT', ['enabled.'])); }
    if (sub === 'off') { config.update({ autoReact: { ...ar, enabled: false } }); return message.channel.send(box('AUTOREACT', ['disabled.'])); }
    if (sub === 'list') {
      const list = ar.triggers.map(t => `${t.keyword} -> ${t.emoji}`).join('\n') || '(none)';
      return message.channel.send(box('AUTOREACT', list.split('\n')));
    }
    if (sub === 'add') {
      const keyword = args[1]; const emoji = args[2];
      if (!keyword || !emoji) return message.channel.send(box('AUTOREACT', ['usage: ;autoreact add <keyword> <emoji>']));
      const triggers = [...ar.triggers.filter(t => t.keyword !== keyword), { keyword, emoji }];
      config.update({ autoReact: { ...ar, triggers } });
      return message.channel.send(box('AUTOREACT', [`added: ${keyword} -> ${emoji}`]));
    }
    if (sub === 'remove') {
      const keyword = args[1];
      const triggers = ar.triggers.filter(t => t.keyword !== keyword);
      config.update({ autoReact: { ...ar, triggers } });
      return message.channel.send(box('AUTOREACT', ['removed.']));
    }
    return message.channel.send(box('AUTOREACT', ['usage: ;autoreact <on|off|add|remove|list>']));
  },
  async _hook(msg, { client }) {
    if (!config.get().autoReact.enabled) return;
    if (msg.author.id === client.user.id) return;
    for (const t of config.get().autoReact.triggers) {
      if (msg.content.toLowerCase().includes(t.keyword.toLowerCase())) {
        msg.react(t.emoji).catch(() => {});
      }
    }
  },
};
