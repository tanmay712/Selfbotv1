// ⬛ VOID config loader
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

const defaults = {
  prefix: ';',
  status: 'idle', // online / idle / dnd / invisible
  rpc: {
    enabled: false,
    clientId: '123456789012345678',
    details: 'Drifting through the void',
    state: 'Nothingness',
    largeImage: 'void',
    largeText: 'VOID',
    smallImage: '',
    smallText: '',
    buttons: [{ label: 'GitHub', url: 'https://github.com/' }],
  },
  autoReact: { enabled: false, triggers: [] },
  autoReply: { enabled: false, dms: true, mentions: true, message: 'I am currently away. — VOID' },
  antiKick: { enabled: false },
  selfRoles: { enabled: false },
  themes: { accent: '#8a2be2', secondary: '#00d4ff' },
};

let cfg = { ...defaults };

function load() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      cfg = deepMerge(defaults, raw);
    } else {
      save();
    }
  } catch (e) {
    console.error('Config load failed, using defaults:', e.message);
  }
  return cfg;
}

function save() {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  return cfg;
}

function deepMerge(a, b) {
  const out = Array.isArray(a) ? [...a] : { ...a };
  for (const k of Object.keys(b || {})) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
      out[k] = deepMerge(a[k] || {}, b[k]);
    } else {
      out[k] = b[k];
    }
  }
  return out;
}

function update(patch) {
  cfg = deepMerge(cfg, patch);
  save();
  return cfg;
}

load();

module.exports = { get: () => cfg, save, update, load };
