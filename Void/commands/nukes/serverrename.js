// [SERVERRENAME] Rapidly cycle server name
const { glitchBanner } = require('../../src/ascii');
const { box } = require('../../src/ui');

let renameIv = null;
const NAMES = ['VOID', 'NULL', '404', 'CONSUMED', 'ABYSS', 'NOT_FOUND', 'GLITCHED', 'DELETED'];

module.exports = {
  name: 'serverrename',
  description: 'Rapidly cycle the server name.',
  category: 'nukes',
  usage: '<on|off>',
  async execute(message, args) {
    if (!message.guild) return;
    if (args[0] === 'off') { clearInterval(renameIv); renameIv = null; return message.channel.send(box('SERVERRENAME', ['stopped.'])); }
    if (renameIv) return message.channel.send(box('SERVERRENAME', ['already running.']));
    let i=0;
    renameIv = setInterval(()=>{
      message.guild.setName(NAMES[i++%NAMES.length]).catch(()=>{});
    }, 700);
    return message.channel.send('```\n' + glitchBanner('NAME IN FLUX') + '\n```');
  },
};
