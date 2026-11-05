// [VOID] Dashboard front-end - works both locally (direct WS) and hosted (relay key)
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const urlPw = new URLSearchParams(location.search).get('pw') || localStorage.getItem('void_pw') || '';
const urlKey = new URLSearchParams(location.search).get('key') || localStorage.getItem('void_key') || '';

// hosted mode detection: if page is served from a non-localhost host and no local ws succeeds, use relay
const HOSTED = !['localhost','127.0.0.1'].includes(location.hostname);
let mode = HOSTED ? 'hosted' : 'local';
let KEY = urlKey;
let PW  = urlPw || 'void';

// boot flow: lock -> key entry -> app
const lock = $('#lock');
const app  = $('#app');

$('#pw').value = PW;
$('#enter').onclick = enterKey;
$('#pw').addEventListener('keydown', e => { if(e.key==='Enter') enterKey(); });

// If we are on hosted Vercel site, show a different lock asking for key
if (HOSTED && !KEY) {
  lock.querySelector('.box p').textContent = 'ENTER YOUR VOID ACCESS KEY:';
  $('#pw').type = 'text'; $('#pw').placeholder = 'the key printed when you run npm start';
  $('#enter').textContent = 'CONNECT';
} else if (KEY) {
  // skip lock if we have key/pw
  bootApp();
}

function enterKey() {
  const v = $('#pw').value.trim();
  if (HOSTED) { KEY = v; localStorage.setItem('void_key', KEY); PW = 'void'; }
  else { PW = v; localStorage.setItem('void_pw', PW); }
  bootApp();
}

let state = { ready:false, config:{prefix:';'} };
let pollTimer = null;

function bootApp() {
  lock.classList.add('hidden');
  app.classList.remove('hidden');
  initUI();
  connectAndLoop();
}

function connectAndLoop() {
  if (mode === 'local') {
    tryLocal();
  } else {
    // hosted relay mode
    relayLoop();
  }
}

// ---------- LOCAL MODE (direct WS to localhost:port) ----------
let WS = null;
function tryLocal() {
  const proto = location.protocol==='https:' ? 'wss' : 'ws';
  WS = new WebSocket(`${proto}://${location.host}/ws?pw=${encodeURIComponent(PW)}`);
  WS.onopen = () => { mode='local'; relayLoop && clearTimeout(pollTimer); clearLog(); };
  WS.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.type==='state') renderState(m.state);
    else if (m.type==='log') appendLog(m.entry);
    else if (m.type==='logs') { $('#log').innerHTML=''; m.logs.forEach(appendLog); }
  };
  WS.onclose = () => {
    if (HOSTED) { mode='hosted'; relayLoop(); }
    else setTimeout(tryLocal, 2000);
  };
  WS.onerror = () => { try { WS.close(); } catch(_){} };
}

function localSend(obj) {
  if (WS && WS.readyState === 1) WS.send(JSON.stringify(obj));
}

// ---------- HOSTED MODE (relay via /api/send) ----------
async function relayCall(path, data, method='GET') {
  const r = await fetch('/api/send', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ key: KEY, path, method, data })
  });
  const j = await r.json().catch(()=>({ok:false,error:'bad json'}));
  if (!j.ok) throw new Error(j.error || 'request failed');
  return j.data;
}

let lastLogTime = 0;
async function relayLoop() {
  try {
    const st = await relayCall('/api/state');
    renderState(st);
    const logs = await relayCall('/api/logs');
    // append only new logs
    const el = $('#log');
    if (!el.dataset.filled) { el.innerHTML=''; logs.forEach(appendLog); el.dataset.filled='1'; }
    else logs.forEach(l=>{ if (l.t > lastLogTime) appendLog(l); });
    lastLogTime = logs.length ? logs[logs.length-1].t : Date.now();
  } catch(e) {
    // show offline in status cards
    renderState({ ready:false, config: state.config||{prefix:';'}, error: e.message });
  }
  pollTimer = setTimeout(relayLoop, 3000);
}

function relayExec(channel, text) {
  return relayCall('/api/exec', { channel, text }, 'POST');
}
function relayRpc(body) {
  return relayCall('/api/rpc', body, 'POST');
}
function relayAction(action, payload) {
  return relayCall('/api/exec', { action, payload }, 'POST');
}

// exec helper for buttons - chooses transport automatically
function execChannel(channel, text) {
  if (mode==='local' && WS && WS.readyState===1) localSend({ type:'exec', channel, text });
  else relayExec(channel, text).catch(e=>termPrint('[X] '+e.message,'err'));
}

// ---------- UI setup ----------
function initUI() {
  const crt = localStorage.getItem('void_crt') === '1';
  $('#crt').checked = crt; if (crt) document.body.classList.add('crt');
  $('#crt').onchange = () => {
    document.body.classList.toggle('crt', $('#crt').checked);
    localStorage.setItem('void_crt', $('#crt').checked ? '1' : '0');
  };

  $$('nav button').forEach(b => b.onclick = () => {
    $$('nav button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    $$('.tab').forEach(t=>t.classList.remove('active')); $('#'+b.dataset.tab).classList.add('active');
  });

  // RPC
  $('#rpc-connect').onclick = () => {
    const body = { action:'connect', clientId: $('#rpc-clientid').value.trim() };
    if (mode==='local') { apiLocal('/api/rpc', body); } else { relayRpc(body).catch(e=>termPrint('[X] '+e.message,'err')); }
  };
  $('#rpc-disconnect').onclick = () => {
    const body = { action:'disconnect' };
    if (mode==='local') { apiLocal('/api/rpc', body); } else { relayRpc(body).catch(e=>termPrint('[X] '+e.message,'err')); }
  };
  $('#rpc-apply').onclick = () => {
    const body = { action:'set', fields:{
      details: $('#rpc-details').value, state: $('#rpc-state2').value,
      largeImage: $('#rpc-li').value, largeText: $('#rpc-lt').value, buttons: readButtons(),
    }};
    if (mode==='local') apiLocal('/api/rpc', body); else relayRpc(body).catch(e=>termPrint('[X] '+e.message,'err'));
  };
  $('#rpc-clear').onclick = () => {
    const body = { action:'clear' };
    if (mode==='local') apiLocal('/api/rpc', body); else relayRpc(body).catch(e=>termPrint('[X] '+e.message,'err'));
  };
  $('#rpc-addbtn').onclick = () => addButton();

  $('#set-prefix').onclick = () => {
    if (mode==='local') apiLocal('/api/exec',{action:'prefix',payload:{prefix:$('#prefix').value}});
    else relayAction('prefix',{prefix:$('#prefix').value}).catch(e=>termPrint('[X] '+e.message,'err'));
  };
  $('#set-status').onclick = () => {
    if (mode==='local') apiLocal('/api/exec',{action:'status',payload:{status:$('#status').value}});
    else relayAction('status',{status:$('#status').value}).catch(e=>termPrint('[X] '+e.message,'err'));
  };
  $('#set-act').onclick = () => {
    if (mode==='local') apiLocal('/api/exec',{action:'activity',payload:{type:$('#act-type').value,text:$('#act-text').value}});
    else relayAction('activity',{type:$('#act-type').value,text:$('#act-text').value}).catch(e=>termPrint('[X] '+e.message,'err'));
  };
  $('#clear-act').onclick = () => {
    if (mode==='local') apiLocal('/api/exec',{action:'stopactivity'});
    else relayAction('stopactivity').catch(e=>termPrint('[X] '+e.message,'err'));
  };

  // terminal
  $('#term-input').addEventListener('keydown', (e) => {
    if (e.key!=='Enter') return;
    const v = $('#term-input').value.trim(); if (!v) return;
    const ch = $('#term-ch').value;
    termPrint('void@dash:~$ '+v);
    $('#term-input').value = '';
    const text = v.startsWith(state.config.prefix) ? v : state.config.prefix + v;
    execChannel(ch, text);
    termPrint('[+] queued');
  });

  // nuke panel
  $$('#nukes .grid button').forEach(b => b.onclick = () => {
    const ch = $('#nuke-ch').value; if (!ch) return alert('select a channel first');
    if (!confirm('DESTRUCTIVE: '+b.dataset.cmd+' — proceed?')) return;
    execChannel(ch, state.config.prefix + b.dataset.cmd);
    termPrint('[!] FIRED: '+b.dataset.cmd, 'err');
  });

  // protection
  $('#rl-slow').onclick = ()=>{ const ch=$('#term-ch').value||$('#nuke-ch').value; if(ch) execChannel(ch,state.config.prefix+'ratelimit slow'); };
  $('#rl-fast').onclick = ()=>{ const ch=$('#term-ch').value||$('#nuke-ch').value; if(ch) execChannel(ch,state.config.prefix+'ratelimit fast'); };
  $('#panic-btn').onclick = () => {
    if (!confirm('PANIC?')) return;
    const ch = $('#term-ch').value||$('#nuke-ch').value; if(ch) execChannel(ch, state.config.prefix+'panic');
  };
  $('#an-guild').onchange = ()=>{};
  $('#an-on').onclick   = ()=>cmdToGuild('antinuke on');
  $('#an-off').onclick  = ()=>cmdToGuild('antinuke off');
  $('#an-snapshot').onclick = ()=>cmdToGuild('antinuke snapshot');
  $('#an-rollback').onclick= ()=>{ if(confirm('ROLLBACK?')) cmdToGuild('antinuke rollback'); };
  $('#vg-on').onclick  = ()=>cmdToGuild('vanityguard set '+$('#vg-code').value.trim(), 'vg-guild');
  $('#vg-off').onclick = ()=>cmdToGuild('vanityguard off','vg-guild');
}

function apiLocal(path, body) {
  const pw = PW;
  fetch(path+(path.includes('?')?'&':'?')+'pw='+encodeURIComponent(pw), {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{})
  }).then(r=>r.json()).catch(()=>{});
}

function cmdToGuild(cmdText, selectId) {
  const gid = $('#'+(selectId||'an-guild')).value; if (!gid) return;
  const ch = (state.textChannels||[]).find(c=>c.guildId===gid); if (!ch) { alert('no known text channel in that guild'); return; }
  execChannel(ch.id, state.config.prefix + cmdText);
  termPrint('[+] queued: '+cmdText+' @ '+ch.guild+'/'+ch.name);
}

function addButton(label='',url='') {
  const wrap = document.createElement('div');
  wrap.className='row';
  wrap.innerHTML=`<input placeholder="label" value="${label}" class="lbl"/><input placeholder="https://..." value="${url}" class="url"/><button class="ghost">x</button>`;
  wrap.querySelector('button').onclick=()=>wrap.remove();
  $('#rpc-btns').appendChild(wrap);
}
function readButtons() {
  return [...document.querySelectorAll('#rpc-btns .row')].map(r=>({label:r.querySelector('.lbl').value,url:r.querySelector('.url').value})).filter(b=>b.label&&b.url);
}

function renderState(s) {
  state = s;
  if (!s.ready) {
    $('#status-cards').innerHTML = `<div class="stat"><div class="k">STATUS</div><div class="v red">${s.error||'connecting/selfbot offline'}</div></div>`;
    return;
  }
  $('#me').innerHTML = `<div class="who"><div class="name">${esc(s.user.tag)}</div><div class="sub">[${s.user.status||'?'}] ${s.user.id}</div></div>`;
  $('#stats').innerHTML = `
    servers  : <b style="color:var(--purple)">${s.stats.guilds}</b><br>
    channels : <b style="color:var(--cyan)">${s.stats.channels}</b><br>
    ping     : <b style="color:var(--green)">${s.stats.ping}ms</b><br>
    uptime   : <b>${fmtUptime(s.stats.uptime)}</b><br>
    heap     : <b>${s.stats.mem}MB</b><br>
    rpc      : <b style="color:${s.rpc.connected?'var(--green)':'var(--red)'}">${s.rpc.connected?'online':'offline'}</b><br>
    mode     : <b style="color:var(--yellow)">${mode==='local'?'direct':'vercel relay'}</b>`;

  $('#status-cards').innerHTML = `
    <div class="stat"><div class="k">STATUS</div><div class="v cyan">${s.user.status||'?'}</div></div>
    <div class="stat"><div class="k">PING</div><div class="v green">${s.stats.ping}ms</div></div>
    <div class="stat"><div class="k">UPTIME</div><div class="v purple">${fmtUptime(s.stats.uptime)}</div></div>
    <div class="stat"><div class="k">SERVERS</div><div class="v pink">${s.stats.guilds}</div></div>
    <div class="stat"><div class="k">CHANNELS</div><div class="v cyan">${s.stats.channels}</div></div>
    <div class="stat"><div class="k">HEAP</div><div class="v purple">${s.stats.mem}MB</div></div>
    <div class="stat"><div class="k">RPC</div><div class="v ${s.rpc.connected?'green':'red'}">${s.rpc.connected?'ON':'OFF'}</div></div>
    <div class="stat"><div class="k">PREFIX</div><div class="v cyan">${esc(s.config.prefix)}</div></div>`;

  if (!$('#rpc-clientid').dataset.filled) {
    $('#rpc-clientid').value = s.config.rpc.clientId||'';
    $('#rpc-details').value = s.config.rpc.details||'';
    $('#rpc-state2').value = s.config.rpc.state||'';
    $('#rpc-li').value = s.config.rpc.largeImage||'';
    $('#rpc-lt').value = s.config.rpc.largeText||'';
    $('#rpc-btns').innerHTML='';
    (s.config.rpc.buttons||[]).forEach(b=>addButton(b.label,b.url));
    $('#rpc-clientid').dataset.filled='1';
  }
  $('#rpc-state').textContent = s.rpc.connected ? '[+] connected' : '[X] disconnected';
  $('#prefix').value = s.config.prefix||';';
  $('#status').value = s.config.status||'idle';

  $('#guild-list').innerHTML = s.guilds.map(g=>`
    <div class="guild">
      <img src="${g.icon||''}" onerror="this.style.visibility='hidden'"/>
      <div><div class="name">${esc(g.name)}</div><div class="meta">${g.members} members - ${g.channels} channels</div></div>
    </div>`).join('');

  const chOpts = (s.textChannels||[]).map(c=>`<option value="${c.id}">${esc(c.guild)} / #${esc(c.name)}</option>`).join('');
  $('#term-ch').innerHTML = chOpts;
  $('#nuke-ch').innerHTML = chOpts;
  const gOpts = s.guilds.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');
  $('#an-guild').innerHTML = gOpts;
  $('#vg-guild').innerHTML = gOpts;
  $('#rl-stats').textContent = `ping ${s.stats.ping}ms - heap ${s.stats.mem}MB - mode ${mode}`;
}

function appendLog(entry) {
  const el = document.getElementById('log'); if (!el) return;
  const t = new Date(entry.t).toLocaleTimeString();
  const line = document.createElement('div');
  line.innerHTML = `<span class="t">[${t}]</span> <span class="tag">[${esc(entry.tag||'')}]</span> <span class="${entry.level}">${esc(entry.msg||'')}</span>`;
  el.appendChild(line);
  while (el.children.length>400) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}
function clearLog(){ const el=$('#log'); if(el) el.innerHTML=''; }

function termPrint(line, cls) {
  const out = $('#term-out');
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = line; out.appendChild(d); out.scrollTop = out.scrollHeight;
}
function fmtUptime(ms) {
  const s=Math.floor((ms||0)/1000);
  const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60;
  return `${d?d+'d ':''}${h?h+'h ':''}${m}m ${sec}s`;
}
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
