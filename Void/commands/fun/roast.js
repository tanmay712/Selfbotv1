const ROASTS = [
  'glitch in the simulation detected: you.',
  '404 intelligence not found.',
  'loading bar stuck at 99%.',
  'malware with a mouth.',
  'brain.core dumped - no recoverable data.',
  'failed to install common sense.',
  'semicolon in a Python file.',
  'dead pixel on the OLED of life.',
  'the void called, it wants its personality back.',
  'if statement that never returns true.',
  'lag spike in real life.',
  'fragmented ego, zero sectors used.',
  'brain.exe has stopped working.',
  'you hit different - like a 404.',
  'even null pointers to you are embarrassed.',
];

module.exports = {
  name: 'roast',
  description: 'Void roast a user.',
  category: 'fun',
  usage: '<user>',
  async execute(message, args) {
    const u = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0].replace(/\D/g, '')).catch(() => null) : message.author);
    if (!u) return message.channel.send('```[ROAST] user not found.```');
    const r = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    return message.channel.send(`${u} ${r}`);
  },
};
