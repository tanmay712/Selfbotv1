// [VOID] Main entry
require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');

const log = require('./logger');
const config = require('./config');
const rpc = require('./rpc');
const printBanner = require('./ascii');
const bootSequence = require('./boot');
const { loadAll } = require('./loader');
const dashboard = require('./dashboard');

// protection modules
const rl = require('./protection/ratelimit');
const ad = require('./protection/antidetect');
const antinuke = require('./protection/antinuke');
const selfguard = require('./protection/selfguard');

// --- Validate environment ---
if (!process.env.TOKEN) {
  log.err('ENV', 'No TOKEN found in .env. Copy .env.example -> .env and fill it in.');
  process.exit(1);
}

// --- Client ---
const client = new Client({ checkUpdate: false, patchVoice: false });

// --- Protection setup (pre-load) ---
rl.setup(client);
ad.setup(client);
antinuke.attach(client);
selfguard.setup(client, config, (reason) => {
  log.err('SELF', `threat triggered: ${reason}`);
});

// --- Load commands & hooks ---
const { commands, hooks, intervals } = loadAll();

// --- Register event hooks from commands ---
const hookMap = {};
for (const h of hooks) {
  if (!hookMap[h.event]) hookMap[h.event] = [];
  hookMap[h.event].push(h.fn);
}
for (const [ev, fns] of Object.entries(hookMap)) {
  client.on(ev, async (...args) => {
    for (const fn of fns) {
      try { await fn(...args, { client, config, commands, log }); }
      catch (e) { log.err('HOOK', `${ev}: ${e.message}`); }
    }
  });
}

// --- Ready ---
client.once('ready', async () => {
  await bootSequence();

  printBanner(config.get().prefix);
  log.ok('AUTH', `logged in as ${client.user.tag} (${client.user.id})`);
  client.user.setStatus(config.get().status || 'idle');

  // run init() on commands that need the live client
  for (const cmd of commands.values()) {
    if (cmd._needsInit && typeof cmd.init === 'function') {
      try { cmd.init(client); } catch(e) { log.err('INIT', `${cmd.name}: ${e.message}`); }
    }
  }

  // selfguard armed by default (defensive)
  selfguard.arm();

  if (config.get().rpc.enabled && config.get().rpc.clientId) {
    rpc.connect(config.get().rpc.clientId).then(() => {
      rpc.setActivity({ ...config.get().rpc, startTimestamp: Date.now() });
    });
  }

  log.info('STATS', `${client.guilds.cache.size} servers - ${client.channels.cache.size} channels - ${client.ws.ping}ms`);
  log.ok('PROT', 'selfguard armed, ratelimiter active, antinuke loaded.');

  client.voidOnDashReady = (url) => {
    log.dash('URL', url);
    console.log('');
    log.ok('READY', `dashboard live at ${url}`);
    console.log('');
  };
  dashboard.start(client);
});

// --- Message command handler (self-only) ---
client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return;

  const prefix = config.get().prefix;
  if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const name = args.shift().toLowerCase();
  const cmd = commands.get(name);
  if (!cmd) return;

  // Sanitize command input for auto-deletion patterns (don't send trigger of destructive ops raw for too long)
  log.cmd('CMD', `${prefix}${name} ${args.join(' ')}`);
  try {
    // rate-limit-aware self-delete on command trigger
    if (!['help','ping','serverinfo','userinfo','avatar','quote','8ball','asciiprofile','ratelimit','antinuke','vanityguard','whitelist'].includes(name)) {
      setTimeout(() => message.delete().catch(()=>{}), 300 + Math.floor(Math.random()*600));
    }
    await cmd.execute(message, args, { client, config, commands, log });
  } catch (e) {
    log.err('CMD', `${name}: ${e.message}`);
    rl.send(message.channel, require('./ui').box('ERROR', [e.message]));
  }
});

client.on('disconnect', () => log.warn('NET', 'disconnected'));
client.on('error', e => log.err('NET', e));
client.on('warn', w => log.warn('NET', w));

function shutdown() {
  log.info('EXIT', 'shutting down...');
  rpc.disconnect();
  rl.panic(true);
  try { client.destroy(); } catch(_){}
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(process.env.TOKEN).catch(e => {
  log.err('AUTH', `login failed: ${e.message}`);
  process.exit(1);
});
