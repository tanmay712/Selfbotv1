// [VOID] Rich Presence controller
const RPC = require('discord-rpc');
const log = require('./logger');

let rpc = null;
let connected = false;
let current = null;

async function connect(clientId) {
  disconnect();
  if (!clientId) return;
  try {
    rpc = new RPC.Client({ transport: 'ipc' });
    rpc.on('ready', () => {
      connected = true;
      log.ok('RPC', `connected | client ${clientId}`);
      if (current) setActivity(current, false);
    });
    rpc.on('disconnected', () => { connected = false; });
    await rpc.login({ clientId }).catch(e => { log.warn('RPC', 'login failed: ' + e.message); connected = false; });
  } catch (e) {
    log.warn('RPC', 'could not start RPC: ' + e.message);
    connected = false;
  }
}

function disconnect() {
  try { if (rpc && rpc.destroy) rpc.destroy(); } catch (_) {}
  rpc = null;
  connected = false;
}

async function setActivity(act, announce = true) {
  current = act;
  if (!rpc || !connected) {
    if (announce) log.warn('RPC', 'not connected - activity queued');
    return false;
  }
  try {
    await rpc.setActivity({
      details: act.details || 'drifting through the void',
      state: act.state || 'nothingness',
      startTimestamp: act.startTimestamp || Date.now(),
      largeImageKey: act.largeImage || 'void',
      largeImageText: act.largeText || 'VOID',
      smallImageKey: act.smallImage || undefined,
      smallImageText: act.smallText || undefined,
      buttons: (act.buttons || []).filter(b => b && b.label && b.url).slice(0, 2),
      instance: false,
    });
    if (announce) log.ok('RPC', 'activity updated');
    return true;
  } catch (e) {
    log.err('RPC', e);
    return false;
  }
}

function clearActivity() {
  current = null;
  if (rpc && connected) { try { rpc.clearActivity(); } catch (_) {} }
}

function getState() { return { connected, current }; }

module.exports = { connect, disconnect, setActivity, clearActivity, getState };
