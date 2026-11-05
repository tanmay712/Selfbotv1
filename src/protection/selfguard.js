// [SELFGUARD] Protect the self account itself:
// - Auto-undo kicks/bans/role removals targeting us where possible
// - Panic mode: on detection of an account-threat (e.g. our perms stripped),
//   trigger actions: clear activity, go invisible, disable all spam/nukes, flush queues,
//   clear recent messages in DMs/last channels, backup DMs to local log file.
// - Reject commands if account is flagged (status == invisible and lockdown on)

const fs = require('fs');
const path = require('path');
const rl = require('./ratelimit');
const log = require('../logger');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'data', 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive:true });

let clientRef = null;
let configRef = null;
let armed = false;
let onThreat = null;

function setup(client, config, threatHandler) {
  clientRef = client;
  configRef = config;
  onThreat = threatHandler || (()=>{});

  client.on('guildMemberUpdate', async (oldM, newM) => {
    if (!armed) return;
    if (newM.id !== client.user.id) return;
    // roles stripped?
    const lostRoles = oldM.roles.cache.filter(r => !newM.roles.cache.has(r.id));
    if (lostRoles.size > 0 && newM.guild.me?.permissions.has('MANAGE_ROLES')) {
      log.warn('SELFGUARD', `${lostRoles.size} roles removed from us in ${newM.guild.name} - attempting re-add`);
      for (const r of lostRoles.values()) {
        await newM.roles.add(r).catch(e => {
          // if we can't re-add -> threat
          triggerPanic('role_removed_unrecoverable');
        });
      }
    }
    // nickname changed against us? not a big deal; ignore.
  });

  client.on('guildMemberRemove', async (m) => {
    if (m.id === client.user.id && armed) {
      log.warn('SELFGUARD', `we were removed from ${m.guild?.name}`);
    }
  });
}

function arm() { armed = true; log.ok('SELFGUARD','armed.'); }
function disarm() { armed = false; log.warn('SELFGUARD','disarmed.'); }

async function triggerPanic(reason) {
  log.err('PANIC', `threat detected: ${reason}`);
  rl.panic(true);
  if (clientRef) {
    try { clientRef.user.setStatus('invisible').catch(()=>{}); } catch(_){}
    try { clientRef.user.setActivity(null).catch(()=>{}); } catch(_){}
    // backup open DMs to file
    try {
      const file = path.join(BACKUP_DIR, `panic-${Date.now()}.log`);
      const ws = fs.createWriteStream(file);
      const dms = clientRef.channels.cache.filter(c=>c.type==='DM');
      for (const dm of dms.values()) {
        const msgs = await dm.messages.fetch({ limit: 50 }).catch(()=>null);
        if (msgs) ws.write(`\n--- DM with ${dm.recipient?.tag || dm.id} ---\n` +
          [...msgs.values()].reverse().map(m=>`[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).join('\n') + '\n');
      }
      ws.end();
      log.ok('PANIC', `DM backup -> ${file}`);
    } catch(e) { log.err('PANIC', e); }
  }
  onThreat(reason);
}

module.exports = { setup, arm, disarm, triggerPanic };
