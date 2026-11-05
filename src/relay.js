// [RELAY] Vercel relay client
// The selfbot instance registers with the hosted Vercel relay using a random key,
// keeps a persistent HTTP connection open, and relays API/ws requests through it.
// Vercel's serverless functions have execution time limits, so we use a polling
// strategy (long-poll) for inbound messages and direct POSTs for outbound.
const https = require('https');
const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');
const log = require('./logger');

function genKey(len=8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s='';
  const b = crypto.randomBytes(len);
  for (let i=0;i<len;i++) s += chars[b[i] % chars.length];
  return s;
}

class RelayClient {
  constructor(relayUrl) {
    this.relayUrl = relayUrl;
    this.key = null;
    this.secret = crypto.randomBytes(24).toString('hex'); // used to sign posts from us
    this.pollTimer = null;
    this.onmessage = () => {};
    this.running = false;
    this.connected = false;
  }

  async register() {
    this.key = genKey(8);
    const res = await this.post('/register', { key: this.key, secret: this.secret });
    if (!res || !res.ok) throw new Error('relay register failed');
    log.ok('RELAY', `registered. key=${this.key}`);
    return this.key;
  }

  start() {
    this.running = true;
    this.poll();
  }

  stop() {
    this.running = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }

  async poll() {
    if (!this.running) return;
    try {
      const msgs = await this.post('/poll', { key: this.key, secret: this.secret, wait: 25 });
      this.connected = true;
      if (msgs && Array.isArray(msgs.items)) {
        for (const m of msgs.items) {
          try {
            const reply = await this.onmessage(m);
            if (m.id && reply !== undefined) {
              await this.post('/reply', { key: this.key, secret: this.secret, id: m.id, data: reply }).catch(()=>{});
            }
          } catch(e) { log.err('RELAY', 'handler: '+e.message); }
        }
      }
    } catch(e) {
      this.connected = false;
      log.warn('RELAY', 'poll error: '+e.message);
    }
    this.pollTimer = setTimeout(()=>this.poll(), this.connected ? 3000 : 5000);
  }

  post(path, body) {
    return new Promise((resolve, reject) => {
      const u = new URL(this.relayUrl + path);
      const data = Buffer.from(JSON.stringify(body));
      const lib = u.protocol === 'https:' ? https : http;
      const req = lib.request({
        method: 'POST', hostname: u.hostname, port: u.port, path: u.pathname,
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
      }, res => {
        let chunks=[];
        res.on('data', c=>chunks.push(c));
        res.on('end', () => {
          let parsed = { ok: false, status: res.statusCode, body: '' };
          try {
            const text = Buffer.concat(chunks).toString('utf8');
            parsed = { ok: res.statusCode < 400, status: res.statusCode, body: text, json: function() { try { return JSON.parse(this.body); } catch(e) { return null; } } };
          } catch(e) {}
          resolve(parsed);
        });
      });
      req.on('error', reject);
      req.setTimeout(40000, ()=>{ req.destroy(new Error('timeout')); });
      req.write(data);
      req.end();
    });
  }
}

module.exports = { RelayClient, genKey };
