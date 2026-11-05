const { STATE, json, cleanup, TTL_MS, readJson } = require('./_lib');
module.exports = async (req, res) => {
  cleanup();
  if (req.method !== 'POST') return json(res,405,{ok:false});
  const body = await readJson(req);
  const { key, secret } = body;
  if (!key || !secret) return json(res,400,{ok:false,error:'missing fields'});
  const c = STATE.clients.get(key) || { queues:new Map(), createdAt:Date.now(), lastSeen:Date.now(), connected:false, _replies:new Map() };
  c.secret = secret; c.lastSeen = Date.now();
  STATE.clients.set(key, c);
  return json(res,200,{ok:true,ttl_ms:TTL_MS});
};
