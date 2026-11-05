const { getClient, json, cleanup, readJson } = require('./_lib');
const crypto = require('crypto');
module.exports = async (req, res) => {
  cleanup();
  if (req.method==='OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    return res.end();
  }
  if (req.method!=='POST') return json(res,405,{ok:false});
  const body = await readJson(req);
  const { key } = body;
  const c = getClient(key);
  if (!c) return json(res,404,{ok:false,error:'no selfbot connected with that key. run npm start and use the new key printed.'});
  if (!c.connected || Date.now()-c.lastSeen > 45_000) return json(res,503,{ok:false,error:'selfbot appears offline.'});
  const id = crypto.randomBytes(8).toString('hex');
  const q = c.queues.get('dash') || []; c.queues.set('dash', q);
  q.push({ id, path: body.path, method: body.method||'GET', data: body.data });
  const start = Date.now();
  while (Date.now()-start < 15_000) {
    const r = (c._replies||new Map()).get(id);
    if (r) { c._replies.delete(id); return json(res,200,{ok:true,data:r}); }
    await new Promise(r=>setTimeout(r,300));
  }
  return json(res,504,{ok:false,error:'timed out waiting for selfbot reply.'});
};
