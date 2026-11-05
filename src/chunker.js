// [CHUNKER] Splits Discord messages at safe boundaries.
// Preserves code-fence (```) integrity, splits at newlines when possible,
// and never produces a chunk longer than Discord's content limit.
//
// Discord limits:
//   normal users  : 2000 chars
//   nitro basic   : 4000 chars
//   nitro premium : 4000 chars
// We default to 1900 to leave 100 chars headroom for safety.

const DEFAULT_LIMIT = 1900;

function findSplitPoint(text, pos) {
  const end = Math.min(pos, text.length);
  for (const sep of ['\n\n', '\n', ' ']) {
    const idx = text.lastIndexOf(sep, end - 1);
    if (idx > 0 && end - idx < end) return idx + sep.length;
  }
  return end;
}

function* linesOf(s) {
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\n') { yield s.slice(start, i + 1); start = i + 1; }
  }
  if (start < s.length) yield s.slice(start);
}

/**
 * Split a string into chunks each <= limit characters, preserving code fences.
 * Rules:
 *   - If the string is <= limit, returns [string] as-is.
 *   - Inside ```...``` blocks, we close ``` at end of current chunk and re-open
 *     ``` in the next chunk so each chunk is valid Markdown on its own.
 *   - Splits at line boundaries when possible, then spaces, then hard cuts.
 *   - Reserves overhead (3 chars for closing ```, 4+tag for re-open) so chunks
 *     never exceed the limit even after the fences are added.
 */
function chunk(s, limit = DEFAULT_LIMIT) {
  if (typeof s !== 'string') return [s];
  if (s.length <= limit) return [s];

  const FENCE_CLOSE = '```';       // 3 chars
  const out = [];
  let inFence = false;
  let fenceTag = '';               // e.g. "js" or ""
  let buf = '';

  function fenceOpen() { return '```' + fenceTag + (fenceTag ? '\n' : '\n'); }

  // Effective budget given current state.
  function budget() {
    // We always need room for closing fence if we're inside one.
    let b = limit;
    if (inFence) b -= FENCE_CLOSE.length;
    // Also: if buf is empty and we're inside a fence, we already have the
    // re-opener in it.
    return b;
  }

  function flush() {
    if (inFence) buf += FENCE_CLOSE;
    out.push(buf);
    buf = inFence ? fenceOpen() : '';
  }

  function ensureRoom(needed) {
    if (buf.length + needed > budget()) {
      flush();
    }
  }

  for (const line of linesOf(s)) {
    // Detect fence toggles on lines that START with ```
    if (/^```[^\n]*\n?$/.test(line)) {
      // If buffer currently has ONLY an auto-opened fence (```<tag>\n) that we
      // added after a flush, and this line is itself a new fence open/close,
      // drop the auto-opener so we don't emit an empty ```\n``` chunk.
      if (inFence && buf === fenceOpen()) {
        buf = '';
      }
      ensureRoom(line.length);
      buf += line;
      const wasInFence = inFence;
      inFence = !inFence;
      if (inFence) {
        fenceTag = line.replace(/^```/, '').trim().replace(/\n$/, '');
      } else {
        fenceTag = '';
      }
      continue;
    }

    // Very long line - need to hard-split.
    if (line.length > limit) {
      // Only flush what's already accumulated if it isn't just a bare fence
      // re-opener (which will be prepended to the first long-line chunk).
      if (buf.length > 0 && !(inFence && buf === fenceOpen())) {
        flush();
      }
      let remaining = line;
      while (remaining.length > 0) {
        if (buf === '' && inFence) buf = fenceOpen();
        const avail = budget() - buf.length;
        if (avail <= 0) { flush(); continue; }
        const slice = remaining.slice(0, avail);
        // Try to split at a space within slice
        const cutAt = findSplitPoint(slice + ' ', slice.length);
        const piece = remaining.slice(0, cutAt);
        remaining = remaining.slice(cutAt);
        buf += piece;
        if (buf.length >= budget() || remaining.length > 0) flush();
      }
      continue;
    }

    // Normal line.
    if (buf.length + line.length > budget()) {
      flush();
    }
    if (inFence && buf === '') buf = fenceOpen();
    buf += line;
  }
  if (buf.length > 0) {
    if (inFence) buf += FENCE_CLOSE;
    out.push(buf);
  }
  return out.filter(c => c.length > 0);
}

/**
 * Split a message payload into <=limit size.
 * Accepts (string), (string, opts), or ({content, ...}).
 * Payloads with embeds/files but no string content are passed through unchanged.
 */
function splitPayload(content, opts, limit = DEFAULT_LIMIT) {
  if (content && typeof content === 'object' && !Array.isArray(content) && !(content instanceof String)) {
    if (typeof content.content === 'string') {
      opts = content;
      content = content.content;
    } else if (content.embeds || content.files) {
      return [content];
    } else {
      return [content];
    }
  }
  if (typeof content !== 'string') return [{ content, ...(opts || {}) }];
  const parts = chunk(content, limit);
  return parts.map(p => ({ content: p, ...(opts || {}) }));
}

module.exports = { chunk, splitPayload, DEFAULT_LIMIT };
