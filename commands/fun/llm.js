const Groq = require('groq-sdk');
const { box } = require('../../src/ui');

module.exports = {
  name: 'llm',
  aliases: ['ai', 'ask', 'chat'],
  description: 'Ask void via Groq AI.',
  category: 'fun',
  usage: '<question>',
  async execute(message, args) {
    if (!process.env.GROQ_API_KEY) return message.channel.send(box('LLM', ['set GROQ_API_KEY in .env.']));
    const q = args.join(' ');
    if (!q) return message.channel.send(box('LLM', ['ask something.']));
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await message.channel.sendTyping().catch(() => {});
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are VOID, a terse dark-humored AI. Keep replies under 1500 chars, no heavy markdown.' },
          { role: 'user', content: q }
        ],
      });
      const out = (res.choices[0]?.message?.content || '...').slice(0, 1900);
      return message.channel.send(box('VOID', [out]));
    } catch (e) { return message.channel.send(box('LLM', [e.message])); }
  },
};
