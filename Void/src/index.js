// ⬛ VOID — Main entry
require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const path = require('path');
const os = require('os');

const log = require('./logger');
const config = require('./config');
const rpc = require('./rpc');
const printBanner = require('./ascii');
const { loadAll } = require('./loader');
const dashboard = require('./dashboard');

// ---- Validate environment ----
if (!process.env.TOKEN) {
  console.error('⚠️  No TOKEN found in .env. Copy .env.example → .env and fill it in.');
  process.exit(1);
}

// ---- Client ----
const client = new Client({ checkUpdate: false, patchVoice: false });

// ---- Load commands & hooks ----
const { commands, hooks } = loadAll();

// ---- Register message/other hooks from commands ----
const hookMap = {};
for (const h of hooks) {
  if (!hookMap[h.event]) hookMap[h.event] = [];
  hookMap[h.event].push(h.fn);
}
for (const [ev, fns] of Object.entries(hookMap)) {
  client.on(ev, async (...args) => {
    for (const fn of fns) {
      try { await fn(...args, { client, config, commands }); } catch(e) { log.err('HOOK', `${ev}: ${e.message}`); }
    }
  });
}

// ---- Ready ----
client.once('ready', async () => {
  printBanner(config.get().prefix);
  log.ok('AUTH', `Logged in as ${client.user.tag} (${client.user.id})`);
  client.user.setStatus(config.get().status || 'idle');

  // Auto-connect RPC if it was enabled
  if (config.get().rpc.enabled && config.get().rpc.clientId) {
    rpc.connect(config.get().rpc.clientId).then(()=>{
      rpc.setActivity({ ...config.get().rpc, startTimestamp: Date.now() });
    });
  }

  log.info('STATS', `${client.guilds.cache.size} servers • ${client.channels.cache.size} channels • ${client.ws.ping}ms`);

  // Start dashboard
  client.voidOnDashReady = (url) => {
    log.dash('URL', url);
    console.log('');
    log.ok('READY', `Dashboard is live at ${url}`);
    console.log('');
  };
  dashboard.start(client);
});

// ---- Message command handler ----
client.on('messageCreate', async (message) => {
  // only respond to self
  if (message.author.id !== client.user.id) return;

  const prefix = config.get().prefix;
  if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const name = args.shift().toLowerCase();
  const cmd = commands.get(name);
  if (!cmd) return; // silent ignore unknowns; use ;help

  log.cmd('CMD', `${prefix}${name} ${args.join(' ')}`);
  try {
    await cmd.execute(message, args, { client, config, commands });
  } catch (e) {
    log.err('CMD', `${name}: ${e.message}`);
    message.channel.send(`⬛ **ERROR** \`\`\`${e.message}\`\`\``).catch(()=>{});
  }
});

// Common events
client.on('disconnect', () => log.warn('NET', 'Disconnected'));
client.on('error', e => log.err('NET', e));
client.on('warn', w => log.warn('NET', w));

// Graceful shutdown
function shutdown() {
  log.info('EXIT', 'Shutting down...');
  rpc.disconnect();
  try { client.destroy(); } catch(_){}
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(process.env.TOKEN).catch(e => {
  log.err('AUTH', `Login failed: ${e.message}`);
  process.exit(1);
});
