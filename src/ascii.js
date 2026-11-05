// [VOID] Boot banner and ASCII art
const chalk = require('chalk');
const { bootBanner } = require('./ui');

module.exports = function printBanner(prefix, dashUrl) {
  const purple = chalk.hex('#8a2be2').bold;
  const cyan   = chalk.hex('#00d4ff').bold;
  const dim    = chalk.gray;

  console.log(purple(bootBanner()));
  console.log(cyan(`  prefix  : ${prefix}`));
  if (dashUrl) {
    console.log(cyan(`  dash    : ${dashUrl}`));
    console.log(dim('  (Ctrl+C to exit)'));
  }
  console.log(dim('=========================================================='));
};

// Glitch-banner for special events (raid, nuke)
module.exports.glitchBanner = function glitchBanner(text) {
  const width = 50;
  const bar = '#'.repeat(width);
  const padl = Math.floor((width - text.length - 2)/2);
  const padr = width - text.length - 2 - padl;
  return [
    bar,
    '#' + ' '.repeat(padl) + text.toUpperCase() + ' '.repeat(padr) + '#',
    bar,
  ].join('\n');
};
