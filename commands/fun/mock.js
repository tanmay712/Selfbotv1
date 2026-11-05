// [MOCK] Sponge-case mock text
const { mock } = require('../../src/ui');

module.exports = {
  name: 'mock',
  description: 'Convert text to mocking sponge case.',
  category: 'fun',
  usage: '<text>',
  async execute(message, args) {
    if (!args.length) return message.channel.send('```[MOCK] usage: ;mock <text>```');
    await message.delete().catch(()=>{});
    return message.channel.send(mock(args.join(' ')));
  },
};
