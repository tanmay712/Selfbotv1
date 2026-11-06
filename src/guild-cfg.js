// [GUILD-CFG] Per-guild persistent JSON config.
// Each server gets a simple key/value store persisted to data/guilds/<id>.json.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'guilds');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const cache = new Map();

function pathFor(gid) {
  return path.join(DIR, `${gid}.json`);
}

function load(gid) {
  if (cache.has(gid)) return cache.get(gid);
  const f = pathFor(gid);
  let data = {};
  try { if (fs.existsSync(f)) data = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; }
  catch (_) {}
  cache.set(gid, data);
  return data;
}

function save(gid) {
  const d = cache.get(gid);
  if (!d) return;
  fs.writeFileSync(pathFor(gid), JSON.stringify(d, null, 2));
}

function get(gid, key, def) {
  const d = load(gid);
  return d[key] !== undefined ? d[key] : def;
}

function set(gid, key, val) {
  const d = load(gid);
  d[key] = val;
  save(gid);
  return d;
}

function update(gid, patch) {
  const d = load(gid);
  Object.assign(d, patch || {});
  save(gid);
  return d;
}

module.exports = { load, save, get, set, update };
