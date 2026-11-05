// ⬛ VOID boot banner
const chalk = require('chalk');

module.exports = function printBanner(prefix, dashUrl) {
  const purple = chalk.hex('#8a2be2').bold;
  const cyan   = chalk.hex('#00d4ff').bold;
  const dim    = chalk.gray;

  const art = [
    '██╗   ██╗ ██████╗ ██╗██████╗ ',
    '██║   ██║██╔═══██╗██║██╔══██╗',
    '██║   ██║██║   ██║██║██║  ██║',
    '╚██╗ ██╔╝██║   ██║██║██║  ██║',
    ' ╚████╔╝ ╚██████╔╝██║██████╔╝',
    '  ╚═══╝   ╚═════╝ ╚═╝╚═════╝ ',
  ];

  const width = art[0].length;

  console.log(purple(art.join('\n')));
  console.log(dim('─'.repeat(width + 8)));
  console.log(cyan('  SELFBOT  v2.0   ') + dim('|   Prefix: ') + chalk.white(prefix));
  if (dashUrl) {
    console.log(dim('  Dashboard ') + chalk.underline.cyan(dashUrl) + dim('   (Press Ctrl+C to stop)'));
  }
  console.log(dim('─'.repeat(width + 8)));
};
