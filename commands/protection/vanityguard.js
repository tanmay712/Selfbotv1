// [VANITYGUARD] Lock vanity URL and attempt to restore it if changed.
const an = require('../../src/protection/antinuke');
const { setVanityCode, fetchVanity } = require('../../src/rest-helpers');
const { box, kvBox } = require('../../src/ui');

module.exports = {
  name: 'vanityguard',
  aliases: ['vg', 'vanity'],
  description: 'Guard the server vanity URL against changes. Requires MANAGE_GUILD + vanity feature (boost lvl 3).',
  category: 'protection',
  usage: '<on|off|set <code>|restore|status>',
  async execute(message, args) {
    if (!message.guild) return message.channel.send(box('VANITYGUARD', ['use in a server.']));
    const gid = message.guild.id;
    const sub = (args[0] || 'status').toLowerCase();

    if (sub === 'on') {
      let code = an.getConfig(gid).vanityCode;
      if (!code) {
        const r = await fetchVanity(message.client, gid);
        if (r.ok && r.code) code = r.code;
        else {
          try { const v = await message.guild.fetchVanityData().catch(()=>null); if (v?.code) code = v.code; } catch {}
        }
      }
      if (!code) return message.channel.send(box('VANITYGUARD', ['could not detect current vanity code. use `;vanityguard set <code>` first.']));
      an.setConfig(gid, { vanityGuard: true, vanityCode: code, enabled: true });
      return message.channel.send(kvBox('VANITYGUARD', [['state','ARMED'],['code', code]]));
    }

    if (sub === 'off') {
      an.setConfig(gid, { vanityGuard: false });
      return message.channel.send(box('VANITYGUARD', ['disarmed.']));
    }

    if (sub === 'set') {
      const code = (args[1] || '').replace(/^discord\.gg\//, '').trim();
      if (!code) return message.channel.send(box('VANITYGUARD', ['usage: ;vanityguard set <code>']));
      an.setConfig(gid, { vanityGuard: true, vanityCode: code, enabled: true });
      return message.channel.send(box('VANITYGUARD', [`watching vanity: ${code}`]));
    }

    if (sub === 'restore') {
      const code = an.getConfig(gid).vanityCode;
      if (!code) return message.channel.send(box('VANITYGUARD', ['no code set. use `;vanityguard set <code>`.']));
      const r = await setVanityCode(message.client, gid, code);
      return message.channel.send(box('VANITYGUARD', [r.ok ? `restored to ${code}.` : `failed: ${r.error}`]));
    }

    // status
    const c = an.getConfig(gid);
    let cur = '(no vanity / no perms)';
    const r = await fetchVanity(message.client, gid);
    if (r.ok && r.code) cur = r.code + ` (${r.uses} uses)`;
    else {
      try { const v = await message.guild.fetchVanityData().catch(()=>null); if (v?.code) cur = v.code; } catch {}
    }
    return message.channel.send(kvBox('VANITYGUARD', [
      ['armed', String(c.vanityGuard)],
      ['watch', c.vanityCode || '(not set)'],
      ['current', cur],
    ]));
  },
};
