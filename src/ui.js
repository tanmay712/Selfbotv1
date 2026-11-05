// [VOID] ASCII box art + terminal-style utilities
// No Unicode emojis anywhere.

// Markers
const M = {
  void: '[VOID]',
  ok:   '[+]',
  err:  '[X]',
  warn: '[!]',
  info: '[i]',
  cmd:  '[>]',
  dash: '[#]',
  in:   '[<]',
};

function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }

// Terminal box in monospace code block. auto-sizes to content width.
function box(title, lines, opts = {}) {
  const allLines = [];
  if (Array.isArray(lines)) allLines.push(...lines.map(x => String(x)));
  else allLines.push(String(lines));
  // split newlines
  const flat = [];
  for (const l of allLines) flat.push(...l.split('\n'));
  // Determine inner width
  const titleStr = title ? ` ${title} ` : '';
  const contentW = Math.max(titleStr.length, ...flat.map(l => l.length), 20);
  const bar = '='.repeat(contentW + 2);
  const thin = '-'.repeat(contentW + 2);
  let out = '```\n';
  // Header
  if (title) {
    const padl = Math.floor((contentW - titleStr.length)/2);
    const padr = contentW - titleStr.length - padl;
    out += `+${'='.repeat(padl)}${titleStr}${'='.repeat(padr)}+\n`;
  } else {
    out += `+${bar}+\n`;
  }
  // Body
  for (const l of flat) {
    out += `| ${pad(l, contentW)} |\n`;
  }
  out += `+${bar}+\n`;
  out += '```';
  return out;
}

function kvBox(title, rows, opts) {
  const lines = rows.map(([k,v]) => `${pad(k, 14)} : ${v}`);
  return box(title, lines, opts);
}

function listBox(title, items, opts) {
  return box(title, items.map((x,i)=>`${pad(`[${i+1}]`, 5)} ${x}`), opts);
}

// Progress bar
function progress(pct, width=30) {
  const filled = Math.round(pct * width);
  return '[' + '#'.repeat(filled) + '-'.repeat(width-filled) + ']';
}

// Retro boot banner
function bootBanner() {
  const lines = [
    '==========================================================',
    '|  __      __       .__           .___    ______   ____   |',
    '| /  \\    /  \\ ____ |__| ____   __| _/   /  __ \\ /_   |  |',
    '| \\   \\/\\/   //  _ \\|  |/  _ \\ / __ |   \\  \\/\\ \\  |   |  |',
    '|  \\        /(  <_> )  (  <_> ) /_/ |   /\\  \\_/ /  |   |  |',
    '|   \\__/\\  /  \\____/|  |\\____/\\____ |   \\_____/   |___|  |',
    '|        \\/          \\/            \\/                    |',
    '|        ----  S E L F B O T   v 2 . 5  ----             |',
    '==========================================================',
  ];
  return lines.join('\n');
}

// Glitch text (ASCII-only, no Unicode weirdness)
function glitch(str) {
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>/?~`';
  return str.split('').map(c => /[a-z0-9]/i.test(c) && Math.random() < 0.25
    ? glitchChars[Math.floor(Math.random()*glitchChars.length)] : c).join('');
}

// Leet translator
const leetMap = { a:'4',b:'8',e:'3',g:'6',l:'1',o:'0',s:'5',t:'7',i:'!',z:'2' };
function leet(str) {
  return str.toLowerCase().split('').map(c => leetMap[c] || c).join('');
}

// Mock/sponge case
function mock(str) {
  return str.split('').map((c,i)=>i%2?c.toUpperCase():c.toLowerCase()).join('');
}

// Fake "hack" / "trace" character animation helpers
function rndIP() {
  return `${rand(1,255)}.${rand(0,255)}.${rand(0,255)}.${rand(0,255)}`;
}
function rand(a,b){return Math.floor(a+Math.random()*(b-a+1));}

module.exports = { M, box, kvBox, listBox, progress, bootBanner, glitch, leet, mock, rndIP, rand, pad };
