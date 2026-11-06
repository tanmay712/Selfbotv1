// [STEAL] Steal a user's avatar and set it as our own.
const { box } = require('../../src/ui');

module.exports = {
  name: 'steal',
  aliases: ['clonepfp', 'copypfp', 'stealavatar'],
  description: "Steal a user's avatar (by mention, id, name, or tag).",
  category: 'stealth',
  usage: '<@user|id|name|tag>',
  async execute(message, args, { client }) {
    if (!args.length && !message.mentions.users.size) {
      return message.channel.send(box('STEAL', ['mention a user, supply an id, name, or tag.']));
    }

    // Resolve target user in order: mention -> id -> name/tag search.
    let target = null;

    if (message.mentions.users.size) {
      target = message.mentions.users.first();
    } else {
      const raw = args.join(' ').trim();
      const id = raw.replace(/\D/g, '');
      if (id && id.length >= 17) {
        target = await client.users.fetch(id).catch(() => null);
      }
      if (!target) {
        // Try exact tag match (name#discrim) or username
        const lower = raw.toLowerCase();
        target = client.users.cache.find(u =>
          u.tag.toLowerCase() === lower ||
          u.username.toLowerCase() === lower ||
          (u.globalName && u.globalName.toLowerCase() === lower) ||
          u.username.toLowerCase().startsWith(lower)
        ) || null;
        if (!target) {
          // Attempt fetch by id even if no digit-only id extracted (e.g. reply-to-user):
          try {
            if (message.reference?.messageId) {
              const ref = await message.channel.messages.fetch(message.reference.messageId).catch(()=>null);
              if (ref) target = ref.author;
            }
          } catch(_) {}
        }
      }
    }

    if (!target) return message.channel.send(box('STEAL', ['user not found. try @mention, id, or exact name/tag.']));

    const av = target.displayAvatarURL({ dynamic: true, format: 'png', size: 1024 });
    try {
      await client.user.setAvatar(av);
    } catch (e) {
      const msg = (e.message || String(e)).toUpperCase();
      if (msg.includes('CAPTCHA')) {
        return message.channel.send(box('STEAL', [
          'Discord is asking for a captcha.',
          'Selfbot cannot solve it automatically.',
          'Wait 5-30 min, or set avatar manually via the client.',
        ]));
      }
      if (msg.includes('RATE') || msg.includes('TOO MANY')) {
        return message.channel.send(box('STEAL', ['rate limited. wait a minute and try again.']));
      }
      return message.channel.send(box('STEAL', [`failed: ${e.message || e}`]));
    }
    return message.channel.send(box('STEAL', [`avatar stolen from ${target.tag}.`]));
  },
};
