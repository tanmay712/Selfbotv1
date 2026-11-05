// [FAKEGAME] Cycle through a big list of fake game activities
const { box } = require('../../src/ui');
const config = require('../../src/config');

const GAMES = [
  'the void', 'mindcrash.exe', 'NULL', 'shadowscan', 'entropy.exe',
  'darknet ops', 'kernel panic', 'reality.sys', 'abyss_demo',
  'counter-strike 2', 'VALORANT', 'League of Legends', 'Fortnite',
  'Minecraft', 'osu!', 'Grand Theft Auto V', 'Cyberpunk 2077',
  'Portal 2', 'Half-Life 3', 'World of Warcraft', 'Elden Ring',
  'Visual Studio Code', 'discord.js-selfbot-v13', 'nmap', 'wireshark',
  'metasploit', 'john the ripper', 'hashcat', 'sudo rm -rf /',
];

let iv = null;
let _client = null;

module.exports = {
  name: 'fakegame',
  description: 'Cycle through fake game activities.',
  category: 'presence',
  usage: '<on|off> [intervalSec]',
  init(client) { _client = client; },
  async execute(message, args) {
    _client = message.client;
    const sub = (args[0]||'').toLowerCase();
    const sec = Math.max(3, parseInt(args[1])||15);
    if (sub === 'off') { stop(); return message.channel.send(box('FAKEGAME', ['off.'])); }
    stop();
    let i = 0;
    _client.user.setActivity(GAMES[0], { type: 'PLAYING' });
    iv = setInterval(() => {
      i = (i+1) % GAMES.length;
      try { _client.user.setActivity(GAMES[i], { type: 'PLAYING' }); } catch(_){}
    }, sec*1000);
    if (iv.unref) iv.unref();
    return message.channel.send(box('FAKEGAME', ['cycling every '+sec+'s.']));
  },
};

function stop(){ if(iv){clearInterval(iv);iv=null;} }
