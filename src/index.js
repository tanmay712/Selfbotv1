// [VOID] Main entry
require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const chalk = require('chalk');

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

// relay (hosted Vercel dashboard)
const { RelayClient } = require('./relay');
const dashRelay = require('./dashboard-relay');

if (!process.env.TOKEN) {
  log.err('ENV', 'No TOKEN found in .env. Copy .env.example -> .env and fill it in.');
  process.exit(1);
}

const client = new Client({ checkUpdate: false, patchVoice: false });

rl.setup(client);
ad.setup(client);
antinuke.attach(client);
selfguard.setup(client, config, (reason) => log.err('SELF', `threat triggered: ${reason}`));

const { commands, hooks, intervals } = loadAll();

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

// Relay setup
const RELAY_URL = process.env.RELAY_URL || 'https://void-selfbot.vercel.app/api';
let relay = null;

client.once('ready', async () => {
  await bootSequence();
  printBanner(config.get().prefix);
  log.ok('AUTH', `logged in as ${client.user.tag} (${client.user.id})`);
  client.user.setStatus(config.get().status || 'idle');

  for (const cmd of commands.values()) {
    if (cmd._needsInit && typeof cmd.init === 'function') {
      try { cmd.init(client); } catch(e) { log.err('INIT', `${cmd.name}: ${e.message}`); }
    }
  }
  selfguard.arm();

  if (config.get().rpc.enabled && config.get().rpc.clientId) {
    rpc.connect(config.get().rpc.clientId).then(() => rpc.setActivity({...config.get().rpc,startTimestamp:Date.now()}));
  }

  log.info('STATS', `${client.guilds.cache.size} servers - ${client.channels.cache.size} channels - ${client.ws.ping}ms`);
  log.ok('PROT', 'selfguard armed, ratelimiter active, antinuke loaded.');

  // Start local dashboard
  client.voidOnDashReady = (url) => {
    log.dash('LOCAL', url);
  };
  dashboard.start(client);

  // Start Vercel relay (public dashboard access via temp key)
  try {
    relay = new RelayClient(RELAY_URL);
    const key = await relay.register();
    dashRelay.attach(client, commands, relay);
    relay.start();
    console.log('');
    console.log(chalk.hex('#00d4ff').bold('  [DASH-HOSTED] ') + chalk.white('open: ') + chalk.underline.cyan(`https://void-selfbot.vercel.app/?key=${key}`));
    console.log(chalk.gray('               key is: ' + chalk.bold(key) + '  (temporary - changes on restart)'));
    console.log('');
  } catch(e) {
    log.warn('RELAY', 'could not register with hosted relay (local dashboard still works): '+e.message);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return;
  const prefix = config.get().prefix;
  if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const name = args.shift().toLowerCase();
  const cmd = commands.get(name);
  if (!cmd) return;
  log.cmd('CMD', `${prefix}${name} ${args.join(' ')}`);
  try {
    if (!['help','ping','serverinfo','userinfo','avatar','quote','8ball','asciiprofile','ratelimit','antinuke','vanityguard','whitelist','rpc','prefix','status','help'].includes(name)) {
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
  if (relay) relay.stop();
  try { client.destroy(); } catch(_){}
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(process.env.TOKEN).catch(e => {
  log.err('AUTH', `login failed: ${e.message}`);
  process.exit(1);
});
