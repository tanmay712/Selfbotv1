const recentDeletes = new Map(); // channelId -> last deleted
const recentEdits = new Map();   // channelId -> last edited (old content)

module.exports = {
  name: 'snipe',
  description: 'Reveal recently deleted/edited messages in this channel.',
  category: 'stealth',
  usage: '[edit]',
  async execute(message, args) {
    const map = args[0] === 'edit' || args[0] === 'e' ? recentEdits : recentDeletes;
    const sniped = map.get(message.channel.id);
    if (!sniped) return message.channel.send('⬛ Nothing to snipe here.');
    const lines = [
      '⬛ **SNIPED**',
      '```',
      `Author : ${sniped.author?.tag || 'unknown'}`,
      `Time   : ${new Date(sniped.t).toLocaleTimeString()}`,
      `Content: ${(sniped.content||'').slice(0,1800)}`,
      '```',
    ].join('\n');
    message.channel.send(lines);
  },
  _onDelete(msg) { if (msg.author && !msg.author.bot) recentDeletes.set(msg.channel.id, { author: msg.author, content: msg.content, t: Date.now(), attachments: [...msg.attachments.values()] }); },
  _onEdit(oldMsg, newMsg) { if (oldMsg.author && !oldMsg.author.bot) recentEdits.set(oldMsg.channel.id, { author: oldMsg.author, content: oldMsg.content, t: Date.now() }); },
};
