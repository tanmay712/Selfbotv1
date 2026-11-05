// [LEET] Convert text to 1337sp34k
const { leet } = require('../../src/ui');

module.exports = {
  name: 'leet',
  description: 'Convert text to 1337sp34k.',
  category: 'fun',
  usage: '<text>',
  async execute(message, args) {
    if (!args.length) return message.channel.send('```[LEET] usage: ;leet <text>```');
    const t = args.join(' ');
    await message.delete().catch(()=>{});
    return message.channel.send(leet(t));
  },
};
