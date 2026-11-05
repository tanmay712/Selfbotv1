const { getClient, json, cleanup } = require('./_lib');
module.exports = async (req, res) => {
  cleanup();
  let key = req.query.key;
  if (req.method==='POST') { const b=await readJson(req); key=b.key||key; }
  if (!key) return json(res,400,{ok:false,error:'key required'});
  const c = getClient(key);
  if (!c) return json(res,404,{ok:false,online:false});
  return json(res,200,{ok:true,online:c.connected && Date.now()-c.lastSeen<45_000,lastSeenAgo:Date.now()-c.lastSeen});
};
