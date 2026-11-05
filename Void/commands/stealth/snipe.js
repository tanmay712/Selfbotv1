const { kvBox } = require('../../src/ui');
const recentDeletes = new Map();
const recentEdits = new Map();

module.exports = {
  name: 'snipe',
  description: 'Show last deleted/edited message in this channel.',
  category: 'stealth',
  usage: '[edit|e]',
  async execute(message, args) {
    const map = args[0]==='edit' || args[0]==='e' ? recentEdits : recentDeletes;
    const s = map.get(message.channel.id);
    if (!s) return message.channel.send(kvBox('SNIPE', [['result', 'nothing to snipe.']]));
    return message.channel.send(kvBox('SNIPE', [
      ['author', s.author?.tag || 'unknown'],
      ['time', new Date(s.t).toLocaleTimeString()],
      ['content', (s.content||'').slice(0,1500)],
    ]));
  },
  _onDelete(msg) { if (msg.author && !msg.author.bot) recentDeletes.set(msg.channel.id, { author: msg.author, content: msg.content, t: Date.now() }); },
  _onEdit(oldMsg) { if (oldMsg.author && !oldMsg.author.bot) recentEdits.set(oldMsg.channel.id, { author: oldMsg.author, content: oldMsg.content, t: Date.now() }); },
};
