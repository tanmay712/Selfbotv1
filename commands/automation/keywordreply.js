// [KEYWORDREPLY] Auto-reply when a keyword appears in any message
const config = require('../../src/config');
const { box } = require('../../src/ui');

module.exports = {
  name: 'keywordreply',
  aliases: ['kwr'],
  description: 'Auto-reply with a message when any user says a keyword.',
  category: 'automation',
  usage: '<on|off|add <keyword>|<reply>|remove <keyword>|list>',
  async execute(message, args) {
    const sub = (args[0]||'').toLowerCase();
    const c = config.get();
    const kw = c.keywordReply;
    if (sub === 'on')  { config.update({ keywordReply: { ...kw, enabled: true }}); return message.channel.send(box('KEYWORDREPLY', ['on.'])); }
    if (sub === 'off') { config.update({ keywordReply: { ...kw, enabled: false }}); return message.channel.send(box('KEYWORDREPLY', ['off.'])); }
    if (sub === 'list') {
      const list = (kw.triggers||[]).map(t => `${t.keyword} -> ${t.reply}`).join('\n') || '(none)';
      return message.channel.send(box('KEYWORDREPLY', list.split('\n')));
    }
    if (sub === 'add') {
      const rest = args.slice(1).join(' ');
      const m = rest.match(/^(.+?)\|(.+)$/);
      if (!m) return message.channel.send(box('KEYWORDREPLY', ['usage: ;keywordreply add <keyword>|<reply>']));
      const keyword = m[1].trim();
      const reply = m[2].trim();
      const triggers = [...(kw.triggers||[]).filter(t=>t.keyword!==keyword), { keyword, reply }];
      config.update({ keywordReply: { ...kw, triggers }});
      return message.channel.send(box('KEYWORDREPLY', [`added: ${keyword} -> ${reply}`]));
    }
    if (sub === 'remove') {
      const keyword = args.slice(1).join(' ');
      const triggers = (kw.triggers||[]).filter(t=>t.keyword!==keyword);
      config.update({ keywordReply: { ...kw, triggers }});
      return message.channel.send(box('KEYWORDREPLY', ['removed.']));
    }
    return message.channel.send(box('KEYWORDREPLY', ['usage:', '  ;keywordreply on', '  ;keywordreply off', '  ;keywordreply add <key>|<reply>', '  ;keywordreply remove <key>', '  ;keywordreply list']));
  },
  async _hook(msg) {
    const kw = config.get().keywordReply;
    if (!kw.enabled) return;
    if (msg.author.id === msg.client.user.id) return;
    const low = msg.content.toLowerCase();
    for (const t of kw.triggers||[]) {
      if (low.includes(t.keyword.toLowerCase())) {
        await msg.channel.send(t.reply).catch(()=>{});
        break;
      }
    }
  },
};
