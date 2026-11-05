// [VANITYGUARD] Lock vanity URL and attempt to restore it if changed.
const an = require('../../src/protection/antinuke');
const { box, kvBox } = require('../../src/ui');

module.exports = {
  name: 'vanityguard',
  aliases: ['vg','vanity'],
  description: 'Guard the server vanity URL against changes.',
  category: 'protection',
  usage: '<on|off|set <code>|status>',
  async execute(message, args) {
    if (!message.guild) return message.channel.send(box('VANITYGUARD', ['use in a server with vanity perms.']));
    const gid = message.guild.id;
    const sub = (args[0] || 'status').toLowerCase();
    if (sub === 'on') {
      let code = an.getConfig(gid).vanityCode;
      try {
        const v = await message.guild.fetchVanityData().catch(()=>null);
        if (v && v.code) code = v.code;
      } catch {}
      an.setConfig(gid, { vanityGuard: true, vanityCode: code, enabled: true });
      return message.channel.send(kvBox('VANITYGUARD', [['state','ARMED'],['code', code || '(unknown)']]));
    }
    if (sub === 'off') {
      an.setConfig(gid, { vanityGuard: false });
      return message.channel.send(box('VANITYGUARD', ['disarmed.']));
    }
    if (sub === 'set') {
      const code = args[1];
      if (!code) return message.channel.send(box('VANITYGUARD', ['usage: ;vanityguard set <code>']));
      an.setConfig(gid, { vanityGuard: true, vanityCode: code, enabled: true });
      return message.channel.send(box('VANITYGUARD', [`watching vanity: ${code}`]));
    }
    const c = an.getConfig(gid);
    let cur = '(unknown)';
    try { const v = await message.guild.fetchVanityData().catch(()=>null); if (v) cur = v.code; } catch {}
    return message.channel.send(kvBox('VANITYGUARD', [
      ['armed', String(c.vanityGuard)],
      ['watch', c.vanityCode || '(not set)'],
      ['current', cur],
    ]));
  },
};
