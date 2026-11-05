// [VOID] Logger — chalk-coloured, tagged, timestamped.
// All messages use ASCII markers: [+] [-] [!] [>] etc. NO emojis.
const chalk = require('chalk');

const RING_MAX = 800;
const ring = [];

function push(level, tag, msg) {
  const entry = { t: Date.now(), level, tag: tag || 'VOID', msg: String(msg) };
  ring.push(entry);
  if (ring.length > RING_MAX) ring.shift();
  if (exports._broadcast) { try { exports._broadcast(entry); } catch (_) {} }
}

const LEVELS = {
  ok:   { c: chalk.greenBright,  label: '[+]' },
  info: { c: chalk.cyanBright,   label: '[i]' },
  warn: { c: chalk.yellowBright, label: '[!]' },
  err:  { c: chalk.redBright,    label: '[X]' },
  cmd:  { c: chalk.magentaBright,label: '[>]' },
  dash: { c: chalk.blueBright,   label: '[#]' },
  in:   { c: chalk.gray,         label: '[<]' },
};

function write(level, tag, msg) {
  const L = LEVELS[level] || LEVELS.info;
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const tagStr = tag ? `[${tag}]` : '';
  const line = `${chalk.gray(`[${ts}]`)} ${L.c(L.label)} ${chalk.gray(tagStr)} ${L.c(msg)}`;
  console.log(line);
  push(level, tag, msg);
}

module.exports = {
  ok:   (tag, m) => write('ok',   tag, m),
  info: (tag, m) => write('info', tag, m),
  warn: (tag, m) => write('warn', tag, m),
  err:  (tag, m) => write('err',  tag, m && m.stack ? m.stack : m),
  cmd:  (tag, m) => write('cmd',  tag, m),
  dash: (tag, m) => write('dash', tag, m),
  in:   (tag, m) => write('in',   tag, m),
  raw:  (level, tag, m) => push(level, tag, m),
  ring: () => ring.slice(),
  _broadcast: null,
};
