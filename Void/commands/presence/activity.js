const types = { PLAYING:0, STREAMING:1, LISTENING:2, WATCHING:3, COMPETING:5 };

module.exports = {
  name: 'activity',
  aliases: ['setactivity'],
  description: 'Set custom Discord activity.',
  category: 'presence',
  usage: '<PLAYING|STREAMING|LISTENING|WATCHING|COMPETING> <text>',
  async execute(message, args, { client }) {
    if (args.length < 2) return message.channel.send('⬛ Usage: ;activity <type> <text>');
    const type = args.shift().toUpperCase();
    if (!types[type]) return message.channel.send('⬛ Invalid type.');
    const name = args.join(' ');
    const opts = { type: types[type] };
    if (type === 'STREAMING') opts.url = 'https://twitch.tv/void';
    client.user.setActivity(name, opts);
    message.channel.send(`⬛ Activity set: ${type} ${name}`);
  },
};
