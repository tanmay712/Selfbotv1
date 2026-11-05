const { box } = require('../../src/ui');
const types = { PLAYING: 0, STREAMING: 1, LISTENING: 2, WATCHING: 3, COMPETING: 5 };

module.exports = {
  name: 'activity',
  aliases: ['setactivity'],
  description: 'Set Discord activity.',
  category: 'presence',
  usage: '<PLAYING|STREAMING|LISTENING|WATCHING|COMPETING> <text>',
  async execute(message, args, { client }) {
    if (args.length < 2) return message.channel.send(box('ACTIVITY', ['usage: ;activity <type> <text>', 'types: PLAYING STREAMING LISTENING WATCHING COMPETING']));
    const type = args.shift().toUpperCase();
    if (types[type] === undefined) return message.channel.send(box('ACTIVITY', ['invalid type.']));
    const name = args.join(' ');
    const opts = { type: types[type] };
    if (type === 'STREAMING') opts.url = 'https://twitch.tv/void';
    client.user.setActivity(name, opts);
    return message.channel.send(box('ACTIVITY', [`${type} ${name}`]));
  },
};
