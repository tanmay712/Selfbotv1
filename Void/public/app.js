// ⬛ VOID Dashboard front-end
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// password from URL
const urlPw = new URLSearchParams(location.search).get('pw') || localStorage.getItem('void_pw') || '';

$('#pw').value = urlPw;

$('#enter').onclick = () => {
  const pw = $('#pw').value.trim();
  localStorage.setItem('void_pw', pw);
  location.search = '?pw=' + encodeURIComponent(pw);
};
$('#pw').addEventListener('keydown', e=>{ if(e.key==='Enter') $('#enter').click(); });

// If URL has pw, immediately try
(async () => {
  const pw = new URLSearchParams(location.search).get('pw');
  if (!pw) return;
  try {
    const r = await fetch('/api/state?pw='+encodeURIComponent(pw));
    if (r.ok) { document.getElementById('lock').classList.add('hidden'); document.getElementById('app').classList.remove('hidden'); initSocket(pw); initUI(); }
  } catch(_){}
})();

let WS = null;
function initSocket(pw) {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  WS = new WebSocket(`${proto}://${location.host}/ws?pw=${encodeURIComponent(pw)}`);
  WS.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.type === 'state') renderState(m.state);
    else if (m.type === 'log') appendLog(m.entry);
    else if (m.type === 'logs') { const el = $('#log'); el.innerHTML=''; m.logs.forEach(appendLog); el.scrollTop = el.scrollHeight; }
  };
  WS.onclose = () => {
    setTimeout(()=>initSocket(pw), 2000);
  };
}

function api(path, body, method='POST') {
  const pw = new URLSearchParams(location.search).get('pw') || '';
  return fetch(path+(path.includes('?')?'&':'?')+'pw='+encodeURIComponent(pw), {
    method, headers:{'Content-Type':'application/json'}, body: body ? JSON.stringify(body) : undefined
  }).then(r=>r.json());
}

function initUI() {
  $$('nav button').forEach(b=>b.onclick=()=>{
    $$('nav button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    $$('.tab').forEach(t=>t.classList.remove('active')); $('#'+b.dataset.tab).classList.add('active');
  });

  $('#rpc-connect').onclick = ()=> api('/api/rpc', { action:'connect', clientId: $('#rpc-clientid').value.trim() });
  $('#rpc-disconnect').onclick = ()=> api('/api/rpc', { action:'disconnect' });
  $('#rpc-apply').onclick = ()=> api('/api/rpc', { action:'set', fields:{
    details: $('#rpc-details').value, state: $('#rpc-state2').value,
    largeImage: $('#rpc-li').value, largeText: $('#rpc-lt').value,
    buttons: readButtons(),
  }});
  $('#rpc-clear').onclick = ()=> api('/api/rpc', { action:'clear' });
  $('#rpc-addbtn').onclick = ()=> addButton();

  $('#set-prefix').onclick = ()=> api('/api/exec', { action:'prefix', payload:{ prefix: $('#prefix').value }});
  $('#set-status').onclick = ()=> api('/api/exec', { action:'status', payload:{ status: $('#status').value }});
  $('#set-act').onclick = ()=> api('/api/exec', { action:'activity', payload:{ type: $('#act-type').value, text: $('#act-text').value }});
  $('#clear-act').onclick = ()=> api('/api/exec', { action:'stopactivity' });
  $('#set-nick').onclick = ()=> api('/api/exec', { action:'nick', payload:{ guild: $('#nick-guild').value, nick: $('#nick-name').value }});
}

function addButton(label='', url='') {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  wrap.innerHTML = `<input placeholder="Label" value="${label}" class="lbl"/><input placeholder="https://..." value="${url}" class="url"/><button class="ghost">x</button>`;
  wrap.querySelector('button').onclick = ()=> wrap.remove();
  $('#rpc-btns').appendChild(wrap);
}
function readButtons() {
  return [...document.querySelectorAll('#rpc-btns .row')].map(r=>{
    return { label: r.querySelector('.lbl').value, url: r.querySelector('.url').value };
  }).filter(b=>b.label && b.url);
}

function renderState(s) {
  if (!s.ready) {
    $('#status-cards').innerHTML = `<div class="card"><span class="dot off"></span>Connecting to Discord... <span class="muted">(check logs)</span></div>`;
    return;
  }
  // me box
  $('#me').innerHTML = `<img src="${s.user.avatar||''}" alt=""/><div class="who"><div class="name">${escape(s.user.tag)}</div><div class="sub"><span class="dot ${s.user.status? 'on':''}"></span>${s.user.status||'unknown'} • ${s.user.id}</div></div>`;

  // stats
  $('#stats').innerHTML = `
    <div>Servers: <b style="color:var(--purple)">${s.stats.guilds}</b></div>
    <div>Channels: <b style="color:var(--cyan)">${s.stats.channels}</b></div>
    <div>Ping: <b style="color:var(--green)">${s.stats.ping}ms</b></div>
    <div>Uptime: <b>${fmtUptime(s.stats.uptime)}</b></div>
    <div>Heap: <b>${s.stats.mem} MB</b></div>
    <div style="margin-top:8px">RPC: <b style="color:${s.rpc.connected?'var(--green)':'var(--red)'}">${s.rpc.connected?'connected':'offline'}</b></div>
  `;

  // status cards
  $('#status-cards').innerHTML = `
    <div class="stat"><div class="k">STATUS</div><div class="v cyan">${s.user.status||'unknown'}</div></div>
    <div class="stat"><div class="k">PING</div><div class="v green">${s.stats.ping}ms</div></div>
    <div class="stat"><div class="k">UPTIME</div><div class="v purple">${fmtUptime(s.stats.uptime)}</div></div>
    <div class="stat"><div class="k">SERVERS</div><div class="v pink">${s.stats.guilds}</div></div>
    <div class="stat"><div class="k">CHANNELS</div><div class="v cyan">${s.stats.channels}</div></div>
    <div class="stat"><div class="k">HEAP</div><div class="v purple">${s.stats.mem}MB</div></div>
    <div class="stat"><div class="k">RPC</div><div class="v ${s.rpc.connected?'green':'red'}">${s.rpc.connected?'ON':'OFF'}</div></div>
    <div class="stat"><div class="k">PREFIX</div><div class="v cyan">${escape(s.config.prefix)}</div></div>
  `;

  // fill RPC form
  if (!$('#rpc-clientid').dataset.filled) {
    $('#rpc-clientid').value = s.config.rpc.clientId || '';
    $('#rpc-details').value = s.config.rpc.details || '';
    $('#rpc-state2').value = s.config.rpc.state || '';
    $('#rpc-li').value = s.config.rpc.largeImage || '';
    $('#rpc-lt').value = s.config.rpc.largeText || '';
    $('#rpc-btns').innerHTML = '';
    (s.config.rpc.buttons||[]).forEach(b=>addButton(b.label,b.url));
    $('#rpc-clientid').dataset.filled='1';
  }
  $('#rpc-state').textContent = s.rpc.connected ? '● connected' : '○ disconnected';

  // presence pre-fills
  $('#prefix').value = s.config.prefix || ';';
  $('#status').value = s.config.status || 'idle';

  // guilds
  $('#guild-list').innerHTML = s.guilds.map(g=>`
    <div class="guild">
      <img src="${g.icon||''}" onerror="this.style.background='#111'"/>
      <div><div class="name">${escape(g.name)}</div><div class="meta">${g.members} members • ${g.channels} channels</div></div>
    </div>`).join('');
  $('#nick-guild').innerHTML = s.guilds.map(g=>`<option value="${g.id}">${escape(g.name)}</option>`).join('');
}

function appendLog(entry) {
  const el = document.getElementById('log');
  if (!el) return;
  const t = new Date(entry.t).toLocaleTimeString();
  const line = document.createElement('div');
  line.innerHTML = `<span class="t">[${t}]</span> <span class="tag">[${escape(entry.tag||'')}]</span> <span class="${entry.level}">${escape(entry.msg||'')}</span>`;
  el.appendChild(line);
  while (el.children.length > 400) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}

function fmtUptime(ms) {
  const s = Math.floor((ms||0)/1000);
  const d = Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), sec=s%60;
  return `${d?d+'d ':''}${h?h+'h ':''}${m}m ${sec}s`;
}
function escape(s){return String(s||'').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
