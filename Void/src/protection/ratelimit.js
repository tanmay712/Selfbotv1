// [RATELIMITER] Smart outbound queue with Discord-bucket-aware pacing.
// - Per-channel cooldowns with jitter to avoid the "self-bot typing pattern"
// - Honours 429 Retry-After headers globally
// - Burst detection: if we're about to send too fast, slow down automatically
//
// Usage:
//   const rl = require('./protection/ratelimit');
//   rl.send(channel, content, opts);   // auto-queued and paced
//   rl.setup(client);                  // hook into REST for 429 handling

const queue = new Map(); // channelId -> [{fn, ts}]
const inFlight = new Map();
let globalCooldownUntil = 0;
let panicking = false;

const CONFIG = {
  baseDelayMs: 350,        // baseline delay between messages in same channel
  jitterMs: 500,           // extra random 0..jitter to humanize
  burstThreshold: 5,       // more than this many messages in 5s = trigger slowdown
  burstWindowMs: 5000,
  slowFactor: 3,           // multiply baseDelay when bursting
  maxQueueSize: 50,        // per-channel
  typing: true,            // send "typing..." for short periods before sending
};

const recent = {}; // channelId -> [timestamps]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function recordSend(chId) {
  if (!recent[chId]) recent[chId] = [];
  const now = Date.now();
  recent[chId] = recent[chId].filter(t => now - t < CONFIG.burstWindowMs);
  recent[chId].push(now);
}

function currentDelay(chId) {
  const arr = recent[chId] || [];
  let delay = CONFIG.baseDelayMs + Math.floor(Math.random() * CONFIG.jitterMs);
  if (arr.length >= CONFIG.burstThreshold) delay *= CONFIG.slowFactor;
  return delay;
}

async function runner(chId, channel) {
  if (inFlight.get(chId)) return;
  inFlight.set(chId, true);
  try {
    while (queue.has(chId) && queue.get(chId).length > 0) {
      if (panicking) { queue.delete(chId); break; }
      const wait = Math.max(0, globalCooldownUntil - Date.now());
      if (wait) await sleep(wait);
      const job = queue.get(chId).shift();
      if (!job) break;
      try {
        const d = currentDelay(chId);
        if (CONFIG.typing && typeof channel.sendTyping === 'function') {
          channel.sendTyping().catch(()=>{});
          await sleep(Math.min(1200, d * 0.4 + 200));
        } else {
          await sleep(d);
        }
        await job.fn();
        recordSend(chId);
      } catch (e) {
        if (e && e.code === 50013) { /* missing perms */ }
        else if (e && e.status === 429) {
          const retry = (e.retry_after || 5) * 1000 + 500;
          globalCooldownUntil = Date.now() + retry;
          // put the job back at front of queue
          queue.get(chId).unshift(job);
          await sleep(retry);
        } else {
          // other error - drop
        }
      }
    }
  } finally {
    inFlight.delete(chId);
    queue.delete(chId);
  }
}

function enqueue(channel, fn) {
  if (panicking) return;
  const chId = channel && channel.id;
  if (!chId) return;
  if (!queue.has(chId)) queue.set(chId, []);
  const q = queue.get(chId);
  if (q.length >= CONFIG.maxQueueSize) q.shift();
  q.push({ fn });
  runner(chId, channel);
}

// High-level send wrapper (analog of channel.send but paced)
function send(channel, content, opts) {
  enqueue(channel, () => channel.send(content, opts));
}

function bulkDelete(channel, msgs) {
  enqueue(channel, () => channel.bulkDelete(msgs, true));
}

function setup(client) {
  // Hook into the REST events to back off globally when 429s happen at HTTP level.
  // discord.js-selfbot-v13 uses a custom REST manager; attach defensively.
  try {
    if (client.rest && typeof client.rest.on === 'function') {
      client.rest.on('rateLimited', (info) => {
        const ms = (info.timeToReset || info.retryAfter || 5) * 1000;
        globalCooldownUntil = Math.max(globalCooldownUntil, Date.now() + ms + 200);
      });
    }
  } catch (_) {}
}

function configure(patch) {
  Object.assign(CONFIG, patch || {});
}

function panic(state) {
  panicking = !!state;
  if (panicking) { queue.clear(); inFlight.clear(); }
}

function stats() {
  return {
    globalCooldownMs: Math.max(0, globalCooldownUntil - Date.now()),
    queues: [...queue.entries()].map(([id, q]) => ({ id, pending: q.length })),
    panicking,
    config: { ...CONFIG },
  };
}

module.exports = { send, enqueue, bulkDelete, setup, configure, panic, stats, sleep };
