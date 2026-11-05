// [BIN] Upload text to a pastebin (hastebin-style) using paste.rs (simplest public paste)
const axios = require('axios');
const { box } = require('../../src/ui');

module.exports = {
  name: 'bin',
  description: 'Upload text or code to a pastebin and return a link (paste.rs).',
  category: 'fun',
  usage: '<text>',
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return message.channel.send(box('BIN', ['usage: ;bin <text> or reply to a message']));
    try {
      const r = await axios.post('https://paste.rs/', text, { headers: { 'Content-Type': 'text/plain' }, maxRedirects: 0, validateStatus: ()=>true });
      const loc = r.headers.location || (r.status >= 200 && r.status < 300 && r.data);
      if (!loc) return message.channel.send(box('BIN', ['failed. status '+r.status]));
      return message.channel.send(box('BIN', [loc.replace(/\s/g,'')]));
    } catch(e) { return message.channel.send(box('BIN', ['failed: '+e.message])); }
  },
};
