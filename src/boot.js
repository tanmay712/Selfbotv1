// [VOID] Retro boot sequence with fake progress
const chalk = require('chalk');
const { progress, M } = require('./ui');
const log = require('./logger');

const MODULES = [
  'loading kernel',
  'mounting /dev/discord',
  'patching websocket',
  'injecting payload',
  'obfuscating traffic',
  'spawning shell',
  'cracking gateway',
  'routing through void',
  'loading command table',
  'initializing RPC',
  'binding dashboard',
  'calibrating nukes',
  'disabling telemetry',
  'entering shadow mode',
];

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

module.exports = async function bootSequence() {
  console.log(chalk.hex('#8a2be2').bold('\n[VOID] INITIALIZING ...\n'));
  for (let i=0;i<MODULES.length;i++){
    const pct = (i+1)/MODULES.length;
    process.stdout.write(
      chalk.gray('  ') + chalk.cyan(M.info) + chalk.gray(' ') +
      chalk.white(MODULES[i] + ' '.repeat(Math.max(0, 28 - MODULES[i].length))) +
      chalk.magenta(progress(pct, 24)) + ' ' +
      chalk.green(Math.floor(pct*100)+'%') + '\r'
    );
    await sleep(25 + Math.floor(Math.random()*80));
  }
  console.log('\n');
  log.ok('BOOT', 'all modules loaded.');
};
