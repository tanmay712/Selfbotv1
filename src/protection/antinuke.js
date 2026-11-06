// [ANTINUKE] Snapshot server state and auto-restore if nuked.
// - Takes per-server snapshots (channels/roles/name/icon/banner) on demand + on a timer
// - Watches for mass channel/role delete/create events; when rate exceeds threshold in a window,
//   automatically triggers rollback: kicks webhooks, locks raids, restores channels/roles/server name.
// - Vanity URL guard: alerts/attempts restore if vanity code is changed.

const fs = require('fs');
const path = require('path');
const log = require('../logger');
const { setVanityCode, fetchVanity } = require('../rest-helpers');const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const state = {}; // guildId -> { snapshots, eventLog, config }

const DEFAULTS = {
  enabled: false,
  snapshotOnStart: true,
  snapshotIntervalMin: 30,
  rollback: true,
  channelDeleteThreshold: 5,    // >N channel deletes in window -> trigger
  roleDeleteThreshold: 4,
  banThreshold: 8,              // bans/min
  webhookThreshold: 3,
  windowMs: 20_000,
  vanityGuard: false,
  vanityCode: null,
  restoreName: true,
  restoreChannels: true,
  restoreRoles: true,
  banRaider: true,
};

function cfgFor(guildId) {
  const s = state[guildId] = state[guildId] || { snapshots: [], events: { channelDeletes:[], roleDeletes:[], bans:[], webhooks:[], memberKicks:[] }, config: { ...DEFAULTS } };
  return s;
}

function loadConfig() {
  const f = path.join(DATA_DIR, 'antinuke.json');
  if (!fs.existsSync(f)) return {};
  try { return JSON.parse(fs.readFileSync(f,'utf8')) || {}; } catch { return {}; }
}
function saveConfig() {
  const out = {};
  for (const [gid, s] of Object.entries(state)) out[gid] = s.config;
  fs.writeFileSync(path.join(DATA_DIR,'antinuke.json'), JSON.stringify(out,null,2));
}

function snapshotGuild(guild) {
  const s = cfgFor(guild.id);
  const snap = {
    t: Date.now(),
    name: guild.name,
    icon: guild.icon,
    banner: guild.banner,
    splash: guild.splash,
    discoverySplash: guild.discoverySplash,
    channels: [...guild.channels.cache.filter(c=>c.type==='GUILD_TEXT'||c.type==='GUILD_CATEGORY').values()].map(c => ({
      id: c.id, name: c.name, type: c.type, parentId: c.parentId, position: c.position, topic: c.topic, nsfw: !!c.nsfw
    })),
    roles: [...guild.roles.cache.values()].filter(r=>r.name!=='@everyone').map(r => ({
      id: r.id, name: r.name, color: r.color, hoist: r.hoist, mentionable: r.mentionable, permissions: r.permissions?.bitfield?.toString(), position: r.position
    })),
    vanityCode: guild.vanityURLCode || null,
  };
  s.snapshots.unshift(snap);
  s.snapshots = s.snapshots.slice(0, 5);
  log.ok('ANTINUKE', `snapshot taken for ${guild.name}`);
  return snap;
}

function getSnapshot(guildId, index=0) {
  return state[guildId]?.snapshots?.[index] || null;
}

function pushEvent(guildId, kind, data) {
  const s = cfgFor(guildId);
  if (!s.config.enabled) return;
  const bucket = s.events[kind] = s.events[kind] || [];
  const now = Date.now();
  bucket.push({ t: now, ...data });
  const window = s.config.windowMs;
  // trim
  while (bucket.length && now - bucket[0].t > window) bucket.shift();
  // evaluate trigger
  const thresholds = { channelDeletes: s.config.channelDeleteThreshold, roleDeletes: s.config.roleDeleteThreshold, bans: s.config.banThreshold, webhooks: s.config.webhookThreshold };
  const limit = thresholds[kind];
  if (limit && bucket.length >= limit) {
    triggerLockdown(guildId, kind);
  }
}

async function triggerLockdown(guildId, reason) {
  const s = cfgFor(guildId);
  if (s._lockdown) return;
  s._lockdown = true;
  log.warn('ANTINUKE', `LOCKDOWN triggered on ${guildId} by ${reason} (${s.events[reason]?.length} events)`);
  // Defer to caller - we'll attach the client reference via attach().
  if (s.client && s.config.rollback) {
    try { await rollback(s.client, guildId); } catch(e) { log.err('ANTINUKE', e); }
  }
  setTimeout(() => { s._lockdown = false; }, 60_000);
}

async function rollback(client, guildId) {
  const s = cfgFor(guildId);
  const snap = getSnapshot(guildId);
  const g = client.guilds.cache.get(guildId);
  if (!g || !snap) return;
  log.warn('ANTINUKE', `rolling back ${g.name} from snapshot @ ${new Date(snap.t).toISOString()}`);
  try {
    // 1. delete all webhooks
    const chs = [...g.channels.cache.filter(c=>c.type==='GUILD_TEXT').values()];
    for (const ch of chs) {
      const whs = await ch.fetchWebhooks().catch(()=>null);
      if (whs) for (const w of whs.values()) { if (w.deletable) await w.delete().catch(()=>{}); }
    }
    // 2. restore server identity
    if (s.config.restoreName) await g.setName(snap.name).catch(()=>{});
    if (snap.icon) await g.setIcon(snap.icon).catch(()=>{});
    if (snap.banner) await g.setBanner(snap.banner).catch(()=>{});
    // 3. delete channels that don't exist in the snapshot (if within sane limits)
    const snapChIds = new Set(snap.channels.map(c=>c.id));
    for (const c of g.channels.cache.values()) {
      if (!snapChIds.has(c.id) && c.type==='GUILD_TEXT' && c.deletable && c.name !== 'void-restored') {
        await c.delete().catch(()=>{});
        await new Promise(r=>setTimeout(r,500));
      }
    }
    // 4. recreate missing channels
    const existingNames = new Set([...g.channels.cache.values()].map(c=>c.name));
    for (const cs of snap.channels) {
      if (!g.channels.cache.has(cs.id) && !existingNames.has(cs.name)) {
        await g.channels.create(cs.name, {
          type: cs.type, topic: cs.topic, nsfw: cs.nsfw, position: cs.position,
        }).catch(()=>{});
        await new Promise(r=>setTimeout(r,600));
      }
    }
    // 5. restore roles that are missing by name (can't restore by id)
    const roleNames = new Set([...g.roles.cache.values()].map(r=>r.name));
    for (const rs of snap.roles) {
      if (!roleNames.has(rs.name)) {
        await g.roles.create({ name: rs.name, color: rs.color, hoist: rs.hoist, mentionable: rs.mentionable, permissions: BigInt(rs.permissions || '0') }).catch(()=>{});
        await new Promise(r=>setTimeout(r,400));
      }
    }
    log.ok('ANTINUKE', `rollback complete on ${g.name}`);
  } catch(e) {
    log.err('ANTINUKE', e);
  }
}

// Vanity URL watcher
async function checkVanity(client, guildId) {
  const s = cfgFor(guildId);
  if (!s.config.vanityGuard || !s.config.vanityCode) return;
  const g = client.guilds.cache.get(guildId);
  if (!g) return;
  try {
    // Try lib fetch first, then REST fallback.
    let cur = null;
    try { const v = await g.fetchVanityData().catch(()=>null); cur = v?.code ?? null; } catch {}
    if (!cur) { const r = await fetchVanity(client, guildId); if (r.ok) cur = r.code; }
    if (cur && cur !== s.config.vanityCode) {
      log.warn('ANTINUKE', `vanity changed ${s.config.vanityCode} -> ${cur}, attempting restore`);
      const r = await setVanityCode(client, guildId, s.config.vanityCode);
      if (!r.ok) log.err('ANTINUKE', 'vanity restore failed: '+r.error);
      else log.ok('ANTINUKE', 'vanity restored to '+s.config.vanityCode);
    }
  } catch (e) { log.err('ANTINUKE', 'vanity check: '+e.message); }
}

function attach(client) {
  const perGuild = loadConfig();
  for (const [gid, c] of Object.entries(perGuild)) {
    state[gid] = state[gid] || { snapshots:[], events:{channelDeletes:[],roleDeletes:[],bans:[],webhooks:[],memberKicks:[]}, config: { ...DEFAULTS } };
    state[gid].config = { ...DEFAULTS, ...c };
  }

  client.on('channelDelete', ch => { if (ch.guild) pushEvent(ch.guild.id, 'channelDeletes', { id: ch.id, name: ch.name }); });
  client.on('roleDelete',    r  => { if (r.guild) pushEvent(r.guild.id, 'roleDeletes', { id: r.id, name: r.name }); });
  client.on('guildBanAdd',   b  => { if (b.guild) pushEvent(b.guild.id, 'bans', { user: b.user?.id }); });
  client.on('webhookUpdate', ch => { if (ch.guild) pushEvent(ch.guild.id, 'webhooks', { id: ch.id }); });

  // Attach client references and take initial snapshots
  client.once('ready', () => {
    for (const g of client.guilds.cache.values()) {
      const s = cfgFor(g.id);
      s.client = client;
      if (s.config.snapshotOnStart && s.config.enabled) snapshotGuild(g);
    }
    // periodic snapshots & vanity checks
    setInterval(() => {
      for (const g of client.guilds.cache.values()) {
        const s = cfgFor(g.id);
        if (!s.config.enabled) continue;
        snapshotGuild(g);
        checkVanity(client, g.id);
      }
    }, 30*60*1000);
    // vanity check every 2 minutes when guarded
    setInterval(() => {
      for (const g of client.guilds.cache.values()) {
        checkVanity(client, g.id);
      }
    }, 120_000);
  });
}

function setConfig(guildId, patch) {
  const s = cfgFor(guildId);
  s.config = { ...s.config, ...patch };
  saveConfig();
  return s.config;
}
function getConfig(guildId) { return cfgFor(guildId).config; }

module.exports = { attach, snapshotGuild, getSnapshot, rollback, setConfig, getConfig };
