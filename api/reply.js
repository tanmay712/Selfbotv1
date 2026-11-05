const { getClient, json, cleanup, readJson } = require('./_lib');
module.exports = async (req, res) => {
  cleanup();
  if (req.method!=='POST') return json(res,405,{ok:false});
  const body = await readJson(req);
  const c = getClient(body.key);
  if (!c || c.secret !== body.secret) return json(res,401,{ok:false});
  c.lastSeen = Date.now();
  c._replies = c._replies || new Map();
  c._replies.set(body.id, body.data);
  setTimeout(()=>c._replies.delete(body.id), 60_000);
  return json(res,200,{ok:true});
};
