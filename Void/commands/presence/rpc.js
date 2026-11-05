const rpc = require('../../src/rpc');
const config = require('../../src/config');

module.exports = {
  name: 'rpc',
  description: 'Toggle/configure Rich Presence.',
  category: 'presence',
  usage: '<connect|disconnect|setdetails|setstate|setimage|addbutton|clear>',
  async execute(message, args) {
    const sub = (args[0]||'').toLowerCase();
    if (sub === 'connect' || sub === 'on') {
      const clientId = args[1];
      if (clientId) config.update({ rpc: { ...config.get().rpc, clientId, enabled: true } });
      rpc.connect(config.get().rpc.clientId);
      return message.channel.send('⬛ Connecting RPC...');
    }
    if (sub === 'disconnect' || sub === 'off') {
      rpc.disconnect();
      config.update({ rpc: { ...config.get().rpc, enabled: false } });
      return message.channel.send('⬛ RPC disconnected.');
    }
    if (sub === 'setdetails') {
      const details = args.slice(1).join(' ') || '';
      config.update({ rpc: { ...config.get().rpc, details } });
      rpc.setActivity({ ...config.get().rpc, startTimestamp: Date.now() });
      return message.channel.send(`⬛ Details set to: ${details}`);
    }
    if (sub === 'setstate') {
      const state = args.slice(1).join(' ') || '';
      config.update({ rpc: { ...config.get().rpc, state } });
      rpc.setActivity({ ...config.get().rpc, startTimestamp: Date.now() });
      return message.channel.send(`⬛ State set to: ${state}`);
    }
    if (sub === 'setimage') {
      const [largeImage, largeText] = args.slice(1);
      if (!largeImage) return message.channel.send('⬛ Usage: ;rpc setimage <key> [text]');
      config.update({ rpc: { ...config.get().rpc, largeImage, largeText: largeText || largeImage } });
      rpc.setActivity({ ...config.get().rpc, startTimestamp: Date.now() });
      return message.channel.send(`⬛ Image set.`);
    }
    if (sub === 'addbutton') {
      const btn = args.slice(1).join(' ').split('|');
      if (btn.length < 2) return message.channel.send('⬛ Usage: ;rpc addbutton <label>|<url>');
      const buttons = [...(config.get().rpc.buttons||[]), { label: btn[0].trim(), url: btn[1].trim() }].slice(0,2);
      config.update({ rpc: { ...config.get().rpc, buttons } });
      rpc.setActivity({ ...config.get().rpc, startTimestamp: Date.now() });
      return message.channel.send('⬛ Button added.');
    }
    if (sub === 'clearbuttons') {
      config.update({ rpc: { ...config.get().rpc, buttons: [] } });
      rpc.setActivity({ ...config.get().rpc, buttons: [], startTimestamp: Date.now() });
      return message.channel.send('⬛ Buttons cleared.');
    }
    if (sub === 'clear') {
      rpc.clearActivity();
      return message.channel.send('⬛ Activity cleared.');
    }
    message.channel.send('⬛ Usage: ;rpc <connect|disconnect|setdetails|setstate|setimage|addbutton|clearbuttons|clear>');
  },
};
