// [LOGSERVER] Log every message in the current (or a specified) channel to a local file
const fs = require('fs');
const path = require('path');
const config = require('../../src/config');
const { box } = require('../../src/ui');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive:true });

let streams = {}; // channelId -> writeStream

module.exports = {
  name: 'logserver',
  description: 'Log every message in a channel to a local file.',
  category: 'automation',
  usage: '<on|off> [channel]',
  init() {
    // re-open any configured logs
    const c = config.get().serverLog;
    if (c.enabled && c.channelId) openStream(c.channelId, c.file);
  },
  async execute(message, args) {
    const ch = message.mentions.channels.first() || message.channel;
    const sub = (args[0]||'on').toLowerCase();
    if (sub === 'off' || sub === 'stop') {
      closeStream(ch.id);
      config.update({ serverLog: { enabled:false, channelId:null, file:null }});
      return message.channel.send(box('LOGSERVER', [`stopped logging #${ch.name}.`]));
    }
    const file = path.join(LOG_DIR, `${ch.id}-${Date.now()}.log`);
    openStream(ch.id, file);
    config.update({ serverLog: { enabled:true, channelId:ch.id, file }});
    return message.channel.send(box('LOGSERVER', [`logging #${ch.name}`, file]));
  },
  async _hook(msg) {
    if (!msg.author) return;
    const s = streams[msg.channel.id];
    if (!s) return;
    const ts = new Date().toISOString().replace('T',' ').split('.')[0];
    s.write(`[${ts}] ${msg.author.tag}: ${msg.content}\n`);
    for (const a of msg.attachments.values()) s.write(`[attachment] ${a.url}\n`);
  },
};

function openStream(chId, file) {
  closeStream(chId);
  const s = fs.createWriteStream(file, { flags:'a' });
  streams[chId] = s;
}
function closeStream(chId) {
  if (streams[chId]) { try { streams[chId].end(); } catch(_){} delete streams[chId]; }
}
