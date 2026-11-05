// Shared state for relay (in-memory per Vercel function instance).
// The key is ephemeral/temporary - on cold-start old keys are dropped, the CLI prints a new one.
if (!global.__void_relay) {
  global.__void_relay = {
    clients: new Map(), // key -> { secret, queues: Map<connId, [msg]>, createdAt, lastSeen, connected, _replies: Map<id,data> }
  };
}
const STATE = global.__void_relay;

const TTL_MS = 6 * 60 * 60 * 1000; // 6h

function cleanup() {
  const now = Date.now();
  for (const [k, c] of STATE.clients) {
    if (now - c.lastSeen > TTL_MS) STATE.clients.delete(k);
  }
}
function getClient(key) { cleanup(); return STATE.clients.get(key) || null; }

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(obj));
}

// Vercel doesn't parse bodies by default for non-standard endpoints; read to string+JSON.
function readJson(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let chunks=[];
    req.on('data', c=>chunks.push(c));
    req.on('end', ()=>{
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')); }
      catch { resolve({}); }
    });
    req.on('error', ()=>resolve({}));
  });
}

module.exports = { STATE, getClient, json, cleanup, TTL_MS, readJson };
