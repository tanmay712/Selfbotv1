// ⬛ VOID Logger — dark-themed, timestamped, with levels and ring buffer for dashboard
const chalk = require('chalk');

const RING_MAX = 500;
const ring = [];

function push(level, tag, msg) {
  const entry = { t: Date.now(), level, tag: tag || 'VOID', msg: String(msg) };
  ring.push(entry);
  if (ring.length > RING_MAX) ring.shift();
  // broadcast via dashboard websocket if attached
  if (exports._broadcast) {
    try { exports._broadcast(entry); } catch (_) {}
  }
}

const LEVELS = {
  ok:   { c: chalk.greenBright,  label: 'OK'   },
  info: { c: chalk.cyanBright,   label: 'INFO' },
  warn: { c: chalk.yellowBright, label: 'WARN' },
  err:  { c: chalk.redBright,    label: 'ERR ' },
  cmd:  { c: chalk.magentaBright, label: 'CMD '},
  dash: { c: chalk.blueBright,   label: 'DASH' },
};

function write(level, tag, msg) {
  const L = LEVELS[level] || LEVELS.info;
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const line = `${chalk.blackBright(`[${ts}]`)} ${L.c(L.label)} ${chalk.gray(`[${tag}]`)} ${L.c(msg)}`;
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
  raw:  (level, tag, m) => push(level, tag, m),
  ring: () => ring.slice(),
  _broadcast: null,
};
