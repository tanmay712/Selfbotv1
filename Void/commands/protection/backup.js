// [BACKUP] Take a local snapshot of the current server (channels/roles/bans/name/icon) as JSON
const fs = require('fs');
const path = require('path');
const an = require('../../src/protection/antinuke');
const { box, kvBox } = require('../../src/ui');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'data', 'manual-backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive:true });

module.exports = {
  name: 'backup',
  description: 'Snapshot current server structure to a JSON file locally.',
  category: 'protection',
  async execute(message) {
    if (!message.guild) return;
    const snap = an.snapshotGuild(message.guild);
    const file = path.join(BACKUP_DIR, `${message.guild.id}-${Date.now()}.json`);
    // extended backup
    const full = {
      ...snap,
      bans: (await message.guild.bans.fetch().catch(()=>new Map())).map(b=>({ user:b.user.id, reason:b.reason })),
      emojis: [...message.guild.emojis.cache.values()].map(e=>({name:e.name,url:e.url})),
      channelsFull: [...message.guild.channels.cache.values()].map(c=>({id:c.id,name:c.name,type:c.type,parentId:c.parentId,position:c.position})),
    };
    fs.writeFileSync(file, JSON.stringify(full, null, 2));
    return message.channel.send(kvBox('BACKUP', [
      ['server', message.guild.name],
      ['file', require('path').basename(file)],
      ['channels', String(full.channelsFull.length)],
      ['roles', String(snap.roles.length)],
    ]));
  },
};
