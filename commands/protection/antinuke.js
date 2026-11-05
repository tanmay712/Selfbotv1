// [ANTINUKE] Command to control antinuke features: on/off/snapshot/rollback/config
const path = require('path');
const an = require('../../src/protection/antinuke');
const { box, kvBox } = require('../../src/ui');

module.exports = {
  name: 'antinuke',
  aliases: ['an','defend','guard'],
  description: 'Server anti-nuke / auto-rollback defense.',
  category: 'protection',
  usage: '<on|off|snapshot|rollback|config|status>',
  async execute(message, args) {
    if (!message.guild) return message.channel.send(box('ANTINUKE', ['use this in a server.']));
    const gid = message.guild.id;
    const sub = (args[0] || 'status').toLowerCase();

    if (sub === 'on') {
      an.setConfig(gid, { enabled: true, rollback: true, snapshotOnStart: true });
      an.snapshotGuild(message.guild);
      return message.channel.send(kvBox('ANTINUKE', [
        ['state', 'ARMED'],
        ['snapshot', 'taken'],
        ['rollback', 'ON'],
      ]));
    }
    if (sub === 'off') {
      an.setConfig(gid, { enabled: false });
      return message.channel.send(box('ANTINUKE', ['disarmed.']));
    }
    if (sub === 'snapshot') {
      const snap = an.snapshotGuild(message.guild);
      return message.channel.send(kvBox('SNAPSHOT', [
        ['channels', String(snap.channels.length)],
        ['roles', String(snap.roles.length)],
        ['name', snap.name],
        ['time', new Date(snap.t).toISOString()],
      ]));
    }
    if (sub === 'rollback') {
      await message.channel.send(box('ANTINUKE', ['initiating manual rollback...']));
      an.snapshotGuild(message.guild);
      await an.rollback(message.client, gid);
      return;
    }
    if (sub === 'config') {
      // set <key> <value>
      const key = args[1]; const val = args.slice(2).join(' ');
      if (!key) {
        const c = an.getConfig(gid);
        return message.channel.send(kvBox('ANTINUKE CFG', Object.entries(c).map(([k,v])=>[k, String(v)])));
      }
      const numVal = Number(val);
      const boolMap = { true:true, false:false };
      const patch = { [key]: boolMap[val] !== undefined ? boolMap[val] : (isNaN(numVal) || val==='' ? val : numVal) };
      an.setConfig(gid, patch);
      return message.channel.send(box('ANTINUKE', [`${key} = ${patch[key]}`]));
    }
    // status
    const c = an.getConfig(gid);
    const snap = an.getSnapshot(gid);
    return message.channel.send(kvBox('ANTINUKE', [
      ['armed', String(c.enabled)],
      ['rollback', String(c.rollback)],
      ['ch threshold', String(c.channelDeleteThreshold)],
      ['role threshold', String(c.roleDeleteThreshold)],
      ['ban threshold', String(c.banThreshold)],
      ['window', String(c.windowMs)+'ms'],
      ['snapshot', snap ? new Date(snap.t).toISOString() : 'none'],
    ]));
  },
};
