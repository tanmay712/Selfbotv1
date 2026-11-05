const ROASTS = [
  "glitch in the simulation detected: it's you.",
  "404 intelligence not found.",
  "you're a loading bar stuck at 99%.",
  "malware with a mouth and nothing else.",
  "brain.core dumped — no recoverable data.",
  "failed to install common sense.",
  "you're a semicolon in a Python file: pointless.",
  "dead pixel on the OLED of life.",
  "the void called — it wants its personality back.",
  "you're an if statement that never returns true.",
  "lag spike in real life.",
  "fragmented ego, zero sectors used.",
  "brain.exe has stopped working.",
  "you hit different — like a 404.",
  "even null pointers to you are embarrassed.",
];

module.exports = {
  name: 'roast',
  description: 'Void-roast a user.',
  category: 'fun',
  usage: '<user>',
  async execute(message, args) {
    const u = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0].replace(/\D/g,'')).catch(()=>null) : message.author);
    if (!u) return message.channel.send('⬛ User not found.');
    const r = ROASTS[Math.floor(Math.random()*ROASTS.length)];
    message.channel.send(`${u} ⬛ ${r}`);
  },
};
