const { getClient, json, cleanup, readJson } = require('./_lib');
module.exports = async (req, res) => {
  cleanup();
  if (req.method!=='POST') return json(res,405,{ok:false});
  const body = await readJson(req);
  const c = getClient(body.key);
  if (!c || c.secret !== body.secret) return json(res,401,{ok:false,error:'bad key'});
  c.lastSeen = Date.now(); c.connected = true;
  const items = [];
  for (const [,q] of c.queues) { while (q.length) items.push(q.shift()); }
  return json(res,200,{ok:true,items});
};
