const Groq = require('groq-sdk');

module.exports = {
  name: 'llm',
  aliases: ['ai','ask','chat'],
  description: 'Ask the void (AI) via Groq. Needs GROQ_API_KEY.',
  category: 'fun',
  usage: '<question>',
  async execute(message, args) {
    if (!process.env.GROQ_API_KEY) return message.channel.send('⬛ Set GROQ_API_KEY in .env first.');
    const q = args.join(' ');
    if (!q) return message.channel.send('⬛ Ask something.');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await message.channel.sendTyping().catch(()=>{});
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role:'system', content:'You are VOID, a terse dark-humored AI that speaks like a hacker entity. Keep replies short (<=1500 chars, no markdown heavy code).' },
          { role:'user', content:q }
        ],
      });
      const out = (res.choices[0]?.message?.content||'...').slice(0,1900);
      message.channel.send('⬛ **VOID**\n'+out);
    } catch(e) { message.channel.send('⬛ LLM error: '+e.message); }
  },
};
