// [QUOTE] Void edgy quotes
const QUOTES = [
  'the void does not answer. it consumes.',
  'in the absence of light, darkness reigns.',
  'every end is a new beginning in the void.',
  'null is not empty. null is potential.',
  'those who stare into the abyss eventually become it.',
  'the quietest places hold the loudest truths.',
  'glitches are just the universe learning to speak.',
  'not found is a place too.',
  'you were not born to be remembered.',
  'the system blames the user for its bugs.',
  'behind every mask is another mask.',
  'entropy is the only honest god.',
];

module.exports = {
  name: 'quote',
  aliases: ['q'],
  description: 'Random void quote.',
  category: 'fun',
  async execute(message) {
    const q = QUOTES[Math.floor(Math.random()*QUOTES.length)];
    return message.channel.send(`\`\`\`\n"${q}"\n   -- the void\n\`\`\``);
  },
};
