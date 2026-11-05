// [PANIC] Emergency button - go invisible, clear activity, stop loops, backup DMs.
const rl = require('../../src/protection/ratelimit');
const sg = require('../../src/protection/selfguard');
const { box } = require('../../src/ui');

module.exports = {
  name: 'panic',
  description: 'Emergency: go invisible, clear activity, halt all queues.',
  category: 'protection',
  async execute(message, _a, { client }) {
    rl.panic(true);
    try { client.user.setStatus('invisible').catch(()=>{}); } catch(_){}
    try { client.user.setActivity(null).catch(()=>{}); } catch(_){}
    await sg.triggerPanic('manual');
    // wipe own message
    await message.delete().catch(()=>{});
    // wait a sec and send confirmation (invisible might not send - try to send in DM to self)
    try {
      const me = await client.users.fetch(client.user.id);
      await me.send(box('PANIC', ['emergency mode engaged. invisible. queues halted.'])).catch(()=>{});
    } catch(_) {}
    setTimeout(() => rl.panic(false), 5000); // release after 5s but keep invisible
  },
};
