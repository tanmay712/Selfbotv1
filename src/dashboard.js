// [VOID] Dashboard - Express + WebSocket live control panel
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');
const { Collection } = require('discord.js-selfbot-v13');
const log = require('./logger');
const rpc = require('./rpc');
const config = require('./config');

// Small helper that always sends JSON, never HTML — even when the handler throws.
function sendJson(res, status, obj) {
  try {
    res.status(status).json(obj);
  } catch (_) {
    try { res.status(500).json({ ok: false, error: 'serialization failed' }); } catch (_) {}
  }
}

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (k, v) => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return '[circular]';
      seen.add(v);
    }
    // Drop BigInts and functions
    if (typeof v === 'bigint') return v.toString();
    if (typeof v === 'function') return undefined;
    if (v instanceof Error) return { message: v.message, stack: v.stack };
    return v;
  });
}

function start(client) {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // JSON body parser with explicit error handling so a bad POST body returns JSON, not HTML.
  app.use(express.json({ limit: '1mb' }));
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return sendJson(res, 400, { ok: false, error: 'invalid json body' });
    }
    next(err);
  });
  app.use(express.static(path.join(__dirname, '..', 'public')));

  function authorized(req) {
    const pw = process.env.DASH_PASSWORD || 'void';
    if (pw === 'none') return true;
    const fromQ = (req.query && req.query.pw) || '';
    const fromH = req.headers['x-void-pw'] || '';
    return fromQ === pw || fromH === pw;
  }

  function wrap(handler) {
    return async (req, res) => {
      try { await handler(req, res); }
      catch (e) {
        log.err('DASH', `${req.method} ${req.path}: ${e.message}`);
        sendJson(res, 500, { ok: false, error: e.message || 'internal error' });
      }
    };
  }

  app.get('/api/state', wrap(async (req, res) => {
    if (!authorized(req)) return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    sendJson(res, 200, buildState(client));
  }));

  app.post('/api/exec', wrap(async (req, res) => {
    if (!authorized(req)) return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    const { action, payload } = req.body || {};
    const result = await applyAction(client, action, payload);
    sendJson(res, 200, { ok: true, result });
    safeBroadcast({ type: 'state', state: buildState(client) });
  }));

  app.post('/api/rpc', wrap(async (req, res) => {
    if (!authorized(req)) return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    const body = req.body || {};
    if (body.action === 'connect') {
      config.update({ rpc: { ...config.get().rpc, enabled: true, clientId: body.clientId || config.get().rpc.clientId } });
      await rpc.connect(config.get().rpc.clientId).catch(e => log.warn('DASH-RPC', e.message));
    } else if (body.action === 'disconnect') {
      rpc.disconnect();
      config.update({ rpc: { ...config.get().rpc, enabled: false } });
    } else if (body.action === 'set') {
      const patch = { ...config.get().rpc, ...body.fields };
      config.update({ rpc: patch });
      await rpc.setActivity({ ...patch, startTimestamp: Date.now() }).catch(e => log.warn('DASH-RPC', e.message));
    } else if (body.action === 'clear') {
      rpc.clearActivity();
    } else if (body.action === 'rotate') {
      config.update({ rpc: { ...config.get().rpc, rotate: body.fields } });
    }
    sendJson(res, 200, { ok: true, rpc: rpc.getState(), config: config.get().rpc });
    safeBroadcast({ type: 'state', state: buildState(client) });
  }));

  app.get('/api/logs', wrap(async (req, res) => {
    if (!authorized(req)) return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    sendJson(res, 200, log.ring());
  }));

  // Build a Collection-shaped stub for mentions in synthetic messages.
  function fakeMentions(initialUsers = [], initialChannels = []) {
    const coll = new Collection();
    for (const u of initialUsers) coll.set(u.id, u);
    coll.has = (id) => coll.has(id);
    return new Proxy(coll, {
      get(target, prop) {
        if (prop in target) return target[prop];
        // Support .first(), .last(), etc. silently returning undefined for safety
        if (prop === 'first') return () => target.first() ?? null;
        if (prop === 'last')  return () => target.last() ?? null;
        return undefined;
      },
    });
  }

  function safeBroadcast(obj) {
    let data;
    try { data = safeStringify(obj); } catch (e) { log.err('DASH-WS', 'stringify: '+e.message); return; }
    wss.clients.forEach(ws => {
      try { if (ws.isAlive && ws._authed && ws.readyState === 1) ws.send(data); } catch (_) {}
    });
  }

  log._broadcast = (entry) => safeBroadcast({ type: 'log', entry });

  wss.on('connection', (ws, req) => {
    try {
      const pw = process.env.DASH_PASSWORD || 'void';
      const url = new URL(req.url, 'http://x');
      const qp = url.searchParams.get('pw') || '';
      ws._authed = pw === 'none' || qp === pw;
      if (!ws._authed) { ws.close(4001, 'unauthorized'); return; }
      ws.isAlive = true;
      ws.on('pong', () => ws.isAlive = true);
      ws.on('error', () => {});

      // Send initial state — catch individually so a single bad field can't kill the connection.
      try { ws.send(safeStringify({ type: 'state', state: buildState(client) })); } catch(e){ log.err('DASH-WS','state-send: '+e.message); }
      try { ws.send(safeStringify({ type: 'logs', logs: log.ring() })); } catch(e){ log.err('DASH-WS','logs-send: '+e.message); }

      ws.on('message', async (raw) => {
        let m;
        try { m = JSON.parse(raw.toString()); } catch(_) { return; }
        try {
          if (m.type === 'exec') {
            const ch = client.channels?.cache?.get(m.channel);
            if (ch && m.text && m.text.startsWith(config.get().prefix)) {
              const userMentions = new Collection();
              const uidMatch = m.text.match(/<@!?(\d+)>/);
              if (uidMatch) userMentions.set(uidMatch[1], { id: uidMatch[1] });
              const fake = {
                author: { id: client.user.id, bot: false },
                content: m.text,
                channel: ch,
                guild: ch.guild || null,
                mentions: {
                  users: userMentions,
                  channels: new Collection(),
                  roles: new Collection(),
                  has: (id) => userMentions.has(id),
                  members: new Collection(),
                  everyone: false,
                },
                delete: async () => {},
                reply: async (t) => ch.send(t),
                edit:  async (t) => ch.send(t),
                react: async () => {},
                fetchReference: async () => null,
                client,
              };
              client.emit('messageCreate', fake);
            }
          }
        } catch(e) { log.err('DASH-WS', 'exec: '+e.message); }
      });
    } catch(e) {
      log.err('DASH-WS', 'connect: '+e.message);
      try { ws.close(1011, 'internal error'); } catch(_) {}
    }
  });

  setInterval(() => {
    wss.clients.forEach(ws => {
      try {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      } catch(_) {}
    });
    safeBroadcast({ type: 'state', state: buildState(client) });
  }, 3000);

  const port = parseInt(process.env.DASH_PORT) || 8484;
  server.listen(port, '0.0.0.0', () => {
    const localUrl = `http://${getLanIP()}:${port}/?pw=${encodeURIComponent(process.env.DASH_PASSWORD || 'void')}`;
    log.dash('DASH', `listening on ${localUrl}`);
    if (client && client.voidOnDashReady) client.voidOnDashReady(localUrl);
    if (process.env.DASH_AUTO_OPEN !== 'false') {
      try { require('open')(localUrl).catch(() => {}); } catch (_) {}
    }
  });

  return { server, broadcast: safeBroadcast };
}

function getLanIP() {
  const ifaces = os.networkInterfaces();
  for (const ifn of Object.keys(ifaces)) {
    for (const addr of ifaces[ifn]) {
      if (addr.family === 'IPv4' && !addr.internal) return addr.address;
    }
  }
  return '127.0.0.1';
}

// Safe builders — never throw; if a field is missing/malformed, return a safe fallback.
function safeIconURL(g) {
  try {
    if (g && typeof g.iconURL === 'function') return g.iconURL({ dynamic: true }) || null;
  } catch(_) {}
  return null;
}
function safeAvatarURL(u) {
  try {
    if (u && typeof u.displayAvatarURL === 'function') return u.displayAvatarURL({ dynamic: true }) || null;
  } catch(_) {}
  return null;
}

function buildState(client) {
  if (!client || !client.user) {
    return {
      ready: false, rpc: { connected: false, current: null }, config: config.get(),
      guilds: [], textChannels: [],
      stats: { uptime: 0, ping: 0, guilds: 0, channels: 0, mem: Math.round(process.memoryUsage().heapUsed/1024/1024) },
      time: Date.now(),
    };
  }

  const guilds = [];
  const textChannels = [];
  let channelCount = 0;

  try {
    if (client.guilds?.cache) {
      for (const g of client.guilds.cache.values()) {
        try {
          if (!g || !g.id || !g.name) continue;
          const gChannels = [];
          let chanSize = 0;
          try {
            if (g.channels?.cache) {
              chanSize = g.channels.cache.size;
              for (const c of g.channels.cache.values()) {
                try {
                  if (!c || !c.id || !c.name) continue;
                  channelCount++;
                  if ((c.type === 'GUILD_TEXT' || c.type === 'text') && gChannels.length < 40) {
                    gChannels.push({ id: c.id, name: c.name });
                    // Only add to global textChannels up to 60 per guild
                    if (textChannels.filter(t => t.guildId === g.id).length < 60) {
                      textChannels.push({ id: c.id, name: c.name, guild: g.name, guildId: g.id });
                    }
                  }
                } catch(_) {}
              }
            }
          } catch(_) {}
          guilds.push({
            id: g.id, name: g.name, icon: safeIconURL(g),
            members: typeof g.memberCount === 'number' ? g.memberCount : 0,
            channels: chanSize,
          });
        } catch(e) { /* skip one bad guild */ }
      }
    }
  } catch(e) { log.err('DASH', 'buildState guilds: '+e.message); }

  let rpcState = { connected: false, current: null };
  try { rpcState = rpc.getState() || rpcState; } catch(_) {}

  return {
    ready: true,
    user: {
      tag: client.user.tag || 'unknown',
      id: client.user.id || '',
      avatar: safeAvatarURL(client.user),
      status: (client.user.presence && client.user.presence.status) || 'offline',
    },
    rpc: rpcState,
    config: config.get(),
    guilds,
    textChannels,
    stats: {
      uptime: Number.isFinite(client.uptime) ? client.uptime : 0,
      ping: client.ws?.ping ?? 0,
      guilds: guilds.length,
      channels: channelCount,
      mem: Math.round(process.memoryUsage().heapUsed/1024/1024),
    },
    time: Date.now(),
  };
}

async function applyAction(client, action, payload) {
  if (!client || !client.user) return { ok: false, error: 'not ready' };
  payload = payload || {};
  try {
    switch (action) {
      case 'status': {
        const s = payload.status;
        if (['online','idle','dnd','invisible'].includes(s)) {
          client.user.setStatus(s);
          config.update({ status: s });
        }
        return { ok: true, status: s };
      }
      case 'activity': {
        const types = { PLAYING:0, STREAMING:1, LISTENING:2, WATCHING:3, COMPETING:5 };
        const t = (payload.type || 'PLAYING').toUpperCase();
        if (types[t] === undefined) return { ok: false, error: 'bad type' };
        const opts = { type: types[t] };
        if (t === 'STREAMING') opts.url = 'https://twitch.tv/void';
        client.user.setActivity(payload.text || 'VOID', opts);
        return { ok: true };
      }
      case 'stopactivity': {
        client.user.setActivity(null);
        return { ok: true };
      }
      case 'nick': {
        if (!payload.guild) return { ok: false, error: 'guild required' };
        const g = client.guilds.cache.get(payload.guild);
        if (!g) return { ok: false, error: 'guild not found' };
        try {
          let me = g.members.cache.get(client.user.id);
          if (!me) me = await g.members.fetch(client.user.id).catch(()=>null);
          if (me) await me.setNickname(payload.nick || '').catch(e => { throw new Error('setNickname failed: ' + e.message); });
        } catch (e) { return { ok: false, error: e.message }; }
        return { ok: true };
      }
      case 'prefix': {
        const p = payload.prefix || ';';
        config.update({ prefix: p });
        return { ok: true, prefix: p };
      }
      default:
        return { ok: false, error: 'unknown action: ' + action };
    }
  } catch(e) {
    return { ok: false, error: e.message || 'action failed' };
  }
}

module.exports = { start, buildState };
