const RESPONSES = [
  'the void says yes', 'the void says no', 'ask the abyss later',
  'signs point to nothingness', 'certain, as certain as entropy',
  'do not count on it', 'yes - but with consequences', 'no, but close',
  'the stars are misaligned', 'it is certain', 'very doubtful',
  'reality bends toward yes', 'answer drifts in the void, try again',
];

module.exports = {
  name: '8ball',
  aliases: ['eightball'],
  description: 'Ask the void.',
  category: 'fun',
  async execute(message, args) {
    if (!args.length) return message.channel.send('```[8BALL] ask a question.```');
    return message.channel.send(`${RESPONSES[Math.floor(Math.random() * RESPONSES.length)]}`);
  },
};
