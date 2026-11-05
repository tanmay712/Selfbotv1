// [MASSREACT] Spam reactions on a target message (or last message in channel)
const { box } = require('../../src/ui');

const REACT_CHARS = ['🇻','🇴','🇮','🇩','🆇','🅰','🅱'];

module.exports = {
  name: 'massreact',
  description: 'Add a burst of reactions to a message (last, or by ID).',
  category: 'nukes',
  usage: '[messageId]',
  async execute(message, args) {
    let target;
    if (args[0]) target = await message.channel.messages.fetch(args[0]).catch(()=>null);
    if (!target) target = (await message.channel.messages.fetch({ limit: 2 })).last();
    if (!target) return message.channel.send(box('MASSREACT', ['no target.']));
    await message.delete().catch(()=>{});
    for (const r of REACT_CHARS) { await target.react(r).catch(()=>{}); await new Promise(x=>setTimeout(x,200)); }
    // 10 extra numbered reacts
    for (let i=0;i<10;i++) await target.react(`${i}⃣`).catch(()=>{});
  },
};
