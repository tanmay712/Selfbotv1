// [FAKESTREAM] Set fake streaming activity to a custom URL
const { box } = require('../../src/ui');

module.exports = {
  name: 'fakestream',
  description: 'Set status to "Streaming" with a custom URL.',
  category: 'presence',
  usage: '<url> [title]',
  async execute(message, args) {
    const url = args[0];
    if (!url || !url.startsWith('http')) return message.channel.send(box('FAKESTREAM', ['usage: ;fakestream <https://twitch.tv/...> [title]']));
    const title = args.slice(1).join(' ') || 'VOID LIVE';
    message.client.user.setActivity(title, { type: 'STREAMING', url });
    return message.channel.send(box('FAKESTREAM', [`streaming: ${title}`, url]));
  },
};
