// [RATELIMITER] Smart outbound queue with Discord-bucket-aware pacing.
// - Per-channel cooldowns with jitter to avoid the "self-bot typing pattern"
// - Honours 429 Retry-After headers globally
// - Burst detection: if we're about to send too fast, slow down automatically
// - Auto-chunks messages that exceed Discord's content limit (2000/4000 chars)
//   while preserving ```fence``` integrity.
//
// Usage:
//   const rl = require('./protection/ratelimit');
//   rl.send(channel, content, opts);   // auto-queued, paced, and chunked
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

// High-level send wrapper (analog of channel.send but paced + chunked).
// Accepts either (channel, string) or (channel, {content, ...}) or (channel, string, opts).
// Auto-splits long content across multiple messages, preserving code fences.
const { splitPayload, DEFAULT_LIMIT } = require('../chunker');

function send(channel, content, opts) {
  // If patchClient() has been applied, channel.send already chunks and queues,
  // so call it directly. Otherwise chunk and queue ourselves (pre-patch path).
  if (patched && _origSend.has(channel)) {
    return channel.send(content, opts);
  }
  let payloads;
  if (typeof content === 'string') {
    payloads = splitPayload(content, opts || {});
  } else if (content && typeof content === 'object' && !Array.isArray(content)) {
    payloads = splitPayload(content);
  } else {
    payloads = [{ content }];
  }
  for (const p of payloads) {
    enqueue(channel, () => rawSend(channel, p));
  }
}

function bulkDelete(channel, msgs) {
  enqueue(channel, () => channel.bulkDelete(msgs, true));
}

// WeakMap from channel instance -> original send function.
// Lets rl.send call the real Discord send without going through our patch a second time.
const _origSend = new WeakMap();

/**
 * Send directly via Discord's API without double-queueing. Used internally
 * by the paced queue after it has already chunked + scheduled the message.
 */
function rawSend(channel, payload) {
  const fn = _origSend.get(channel) || channel.send;
  return fn.call(channel, payload);
}

/**
 * Monkey-patch channel .send() so ALL call sites (including 189 direct
 * channel.send() calls) auto-chunk + go through the paced queue, preventing
 * "Invalid Form Body: Must be 4000 or fewer in length" errors.
 * Idempotent.
 */
let patched = false;
function patchClient(client) {
  if (patched) return;
  patched = true;
  const protos = new Set();
  // Grab prototypes from discord.js-selfbot-v13 structure exports
  try {
    const DJS = require.cache[require.resolve('discord.js-selfbot-v13')];
    if (DJS && DJS.exports) {
      for (const name of ['TextChannel', 'DMChannel', 'NewsChannel',
                          'ThreadChannel', 'PartialGroupDMChannel',
                          'NewsThreadChannel', 'PrivateThreadChannel',
                          'PublicThreadChannel']) {
        if (DJS.exports[name]?.prototype) protos.add(DJS.exports[name].prototype);
      }
    }
  } catch (_) {}
  // Fallback: grab a prototype from a real channel instance.
  const anyChannel = client.channels?.cache?.find?.(c => typeof c.send === 'function');
  if (anyChannel) protos.add(Object.getPrototypeOf(anyChannel));

  for (const proto of protos) {
    if (!proto || proto.__voidPatched) continue;
    const orig = proto.send;
    if (typeof orig !== 'function') continue;
    proto.send = function patchedSend(content, opts) {
      // Record the unpatched fn on each instance so rawSend() can use it.
      if (!_origSend.has(this)) _origSend.set(this, orig);
      let payloads;
      try { payloads = splitPayload(content, opts); }
      catch (_) { payloads = [{ content }]; }

      // Single-chunk fast path.
      if (payloads.length === 1) {
        return new Promise((resolve, reject) => {
          enqueue(this, async () => {
            try { resolve(await orig.call(this, payloads[0])); }
            catch (e) { reject(e); }
          });
        });
      }
      // Multi-chunk: send in sequence, return the last message.
      let last = null;
      let chain = Promise.resolve();
      for (const p of payloads) {
        chain = chain.then(() => new Promise((resolve, reject) => {
          enqueue(this, async () => {
            try { last = await orig.call(this, p); resolve(); }
            catch (e) { reject(e); }
          });
        }));
      }
      return chain.then(() => last);
    };
    proto.send.__voidOrig = orig;
    proto.__voidPatched = true;
  }
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

module.exports = { send, enqueue, bulkDelete, setup, configure, panic, stats, sleep, patchClient };
