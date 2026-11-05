// [VOID] Dashboard front-end
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const urlPw = new URLSearchParams(location.search).get('pw') || localStorage.getItem('void_pw') || '';
$('#pw').value = urlPw;
$('#enter').onclick = () => {
  const pw = $('#pw').value.trim();
  localStorage.setItem('void_pw', pw);
  location.search = '?pw=' + encodeURIComponent(pw);
};
$('#pw').addEventListener('keydown', e => { if(e.key==='Enter') $('#enter').click(); });

let WS = null;
let state = { ready:false };

(async () => {
  const pw = new URLSearchParams(location.search).get('pw');
  if (!pw) return;
  try {
    const r = await fetch('/api/state?pw='+encodeURIComponent(pw));
    if (r.ok) {
      document.getElementById('lock').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      initSocket(pw); initUI();
    }
  } catch(_){}
})();

function initSocket(pw) {
  const proto = location.protocol==='https:' ? 'wss' : 'ws';
  WS = new WebSocket(`${proto}://${location.host}/ws?pw=${encodeURIComponent(pw)}`);
  WS.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.type === 'state') { state = m.state; renderState(m.state); }
    else if (m.type === 'log') appendLog(m.entry);
    else if (m.type === 'logs') { const el = $('#log'); el.innerHTML=''; m.logs.forEach(appendLog); el.scrollTop = el.scrollHeight; }
  };
  WS.onclose = () => setTimeout(()=>initSocket(pw), 2000);
}

function api(path, body, method='POST') {
  const pw = new URLSearchParams(location.search).get('pw') || '';
  const sep = path.includes('?')?'&':'?';
  return fetch(path+sep+'pw='+encodeURIComponent(pw), {
    method, headers:{'Content-Type':'application/json'}, body: body?JSON.stringify(body):undefined
  }).then(r=>r.json());
}

function termPrint(line, cls) {
  const out = $('#term-out');
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = line;
  out.appendChild(d);
  out.scrollTop = out.scrollHeight;
}

function initUI() {
  // CRT toggle
  const crt = localStorage.getItem('void_crt') === '1';
  $('#crt').checked = crt; if (crt) document.body.classList.add('crt');
  $('#crt').onchange = () => {
    document.body.classList.toggle('crt', $('#crt').checked);
    localStorage.setItem('void_crt', $('#crt').checked ? '1' : '0');
  };

  // tabs
  $$('nav button').forEach(b => b.onclick = () => {
    $$('nav button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    $$('.tab').forEach(t=>t.classList.remove('active')); $('#'+b.dataset.tab).classList.add('active');
  });

  // RPC
  $('#rpc-connect').onclick = () => api('/api/rpc', { action:'connect', clientId: $('#rpc-clientid').value.trim() });
  $('#rpc-disconnect').onclick = () => api('/api/rpc', { action:'disconnect' });
  $('#rpc-apply').onclick = () => api('/api/rpc', { action:'set', fields:{
    details: $('#rpc-details').value, state: $('#rpc-state2').value,
    largeImage: $('#rpc-li').value, largeText: $('#rpc-lt').value,
    buttons: readButtons(),
  }});
  $('#rpc-clear').onclick = () => api('/api/rpc', { action:'clear' });
  $('#rpc-addbtn').onclick = () => addButton();

  // presence
  $('#set-prefix').onclick = () => api('/api/exec', { action:'prefix', payload:{ prefix: $('#prefix').value }});
  $('#set-status').onclick = () => api('/api/exec', { action:'status', payload:{ status: $('#status').value }});
  $('#set-act').onclick = () => api('/api/exec', { action:'activity', payload:{ type: $('#act-type').value, text: $('#act-text').value }});
  $('#clear-act').onclick = () => api('/api/exec', { action:'stopactivity' });

  // terminal
  $('#term-input').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const v = $('#term-input').value.trim();
    if (!v) return;
    const ch = $('#term-ch').value;
    termPrint('void@dash:~$ ' + v);
    $('#term-input').value = '';
    if (!ch) { termPrint('[!] no channel selected', 'err'); return; }
    const text = v.startsWith(state.config.prefix) ? v : state.config.prefix + v;
    WS.send(JSON.stringify({ type:'exec', channel: ch, text }));
    termPrint('[+] queued (' + text.length + ' chars)', 'ok');
  });

  // nuke panel
  $$('#nukes .grid button').forEach(b => b.onclick = () => {
    const ch = $('#nuke-ch').value;
    if (!ch) { alert('select a target channel first'); return; }
    if (!confirm('DESTRUCTIVE - fire '+b.dataset.cmd+' into this channel?')) return;
    WS.send(JSON.stringify({ type:'exec', channel: ch, text: state.config.prefix + b.dataset.cmd }));
    termPrint('[!] FIRED: ' + b.dataset.cmd, 'err');
  });

  // protection panel
  $('#rl-slow').onclick = () => WS.send(JSON.stringify({ type:'exec', channel: $('#term-ch').value || $('#nuke-ch').value, text: state.config.prefix + 'ratelimit slow' }));
  $('#rl-fast').onclick = () => WS.send(JSON.stringify({ type:'exec', channel: $('#term-ch').value || $('#nuke-ch').value, text: state.config.prefix + 'ratelimit fast' }));
  $('#panic-btn').onclick = () => {
    if (!confirm('ENGAGE PANIC - invisible, stop all queues?')) return;
    const ch = $('#term-ch').value || $('#nuke-ch').value;
    if (ch) WS.send(JSON.stringify({ type:'exec', channel: ch, text: state.config.prefix + 'panic' }));
  };
  $('#an-guild').onchange = updateAnStatus;
  $('#an-on').onclick = () => cmdToGuild('antinuke on');
  $('#an-off').onclick = () => cmdToGuild('antinuke off');
  $('#an-snapshot').onclick = () => cmdToGuild('antinuke snapshot');
  $('#an-rollback').onclick = () => { if (confirm('ROLLBACK - restore channels/roles from last snapshot?')) cmdToGuild('antinuke rollback'); };
  $('#vg-on').onclick = () => cmdToGuild('vanityguard set ' + $('#vg-code').value.trim(), 'vg-guild');
  $('#vg-off').onclick = () => cmdToGuild('vanityguard off', 'vg-guild');
}

function cmdToGuild(cmdText, selectId) {
  // Need a text channel in that guild; pick first text channel from state.textChannels
  const gid = $('#'+(selectId||'an-guild')).value;
  if (!gid) return;
  const ch = (state.textChannels||[]).find(c=>c.guildId===gid);
  if (!ch) { alert('no text channel known in that guild'); return; }
  WS.send(JSON.stringify({ type:'exec', channel: ch.id, text: state.config.prefix + cmdText }));
  termPrint('[+] queued: '+cmdText+' @ '+ch.guild+'/'+ch.name);
}
function updateAnStatus() {
  const gid = $('#an-guild').value;
  if (!gid) { $('#an-status').textContent=''; return; }
  const g = state.guilds.find(x=>x.id===gid);
  $('#an-status').textContent = g ? 'armed state: (see ;antinuke status in discord)' : '';
}

function addButton(label='', url='') {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  wrap.innerHTML = `<input placeholder="label" value="${label}" class="lbl"/><input placeholder="https://..." value="${url}" class="url"/><button class="ghost">x</button>`;
  wrap.querySelector('button').onclick = () => wrap.remove();
  $('#rpc-btns').appendChild(wrap);
}
function readButtons() {
  return [...document.querySelectorAll('#rpc-btns .row')].map(r => ({
    label: r.querySelector('.lbl').value, url: r.querySelector('.url').value
  })).filter(b=>b.label && b.url);
}

function renderState(s) {
  state = s;
  if (!s.ready) {
    $('#status-cards').innerHTML = `<div class="stat"><div class="k">STATUS</div><div class="v red">connecting...</div></div>`;
    return;
  }
  $('#me').innerHTML = `<div class="who"><div class="name">${esc(s.user.tag)}</div><div class="sub">[${s.user.status||'?'}] ${s.user.id}</div></div>`;
  $('#stats').innerHTML = `
    servers  : <b style="color:var(--purple)">${s.stats.guilds}</b><br>
    channels : <b style="color:var(--cyan)">${s.stats.channels}</b><br>
    ping     : <b style="color:var(--green)">${s.stats.ping}ms</b><br>
    uptime   : <b>${fmtUptime(s.stats.uptime)}</b><br>
    heap     : <b>${s.stats.mem}MB</b><br>
    rpc      : <b style="color:${s.rpc.connected?'var(--green)':'var(--red)'}">${s.rpc.connected?'online':'offline'}</b>`;

  $('#status-cards').innerHTML = `
    <div class="stat"><div class="k">STATUS</div><div class="v cyan">${s.user.status||'?'}</div></div>
    <div class="stat"><div class="k">PING</div><div class="v green">${s.stats.ping}ms</div></div>
    <div class="stat"><div class="k">UPTIME</div><div class="v purple">${fmtUptime(s.stats.uptime)}</div></div>
    <div class="stat"><div class="k">SERVERS</div><div class="v pink">${s.stats.guilds}</div></div>
    <div class="stat"><div class="k">CHANNELS</div><div class="v cyan">${s.stats.channels}</div></div>
    <div class="stat"><div class="k">HEAP</div><div class="v purple">${s.stats.mem}MB</div></div>
    <div class="stat"><div class="k">RPC</div><div class="v ${s.rpc.connected?'green':'red'}">${s.rpc.connected?'ON':'OFF'}</div></div>
    <div class="stat"><div class="k">PREFIX</div><div class="v cyan">${esc(s.config.prefix)}</div></div>`;

  // prefill RPC
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

  // guilds + text channels
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
  // RL stats
  $('#rl-stats').textContent = `ping ${s.stats.ping}ms - heap ${s.stats.mem}MB - queues running. use ;ratelimit in discord for live numbers.`;
  updateAnStatus();
}

function appendLog(entry) {
  const el = document.getElementById('log');
  if (!el) return;
  const t = new Date(entry.t).toLocaleTimeString();
  const line = document.createElement('div');
  line.innerHTML = `<span class="t">[${t}]</span> <span class="tag">[${esc(entry.tag||'')}]</span> <span class="${entry.level}">${esc(entry.msg||'')}</span>`;
  el.appendChild(line);
  while (el.children.length>400) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}

function fmtUptime(ms) {
  const s=Math.floor((ms||0)/1000);
  const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60;
  return `${d?d+'d ':''}${h?h+'h ':''}${m}m ${sec}s`;
}
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
