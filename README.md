# [VOID] Selfbot v2.5

76-command Discord selfbot with a **local web dashboard** and a **public Vercel-hosted dashboard** accessed via a temporary access key printed on startup. ASCII retro UI, Rich Presence controls, automation, anti-nuke / anti-ban protection, nukes, stealth, fun.

> [WARNING] Selfbots violate Discord's Terms of Service. Educational use only. Use throwaway accounts.

## Quick start

```bash
npm install
cp .env.example .env
# edit .env - fill in TOKEN
npm start
```

On startup you'll see the retro boot sequence, a local dashboard URL, and a hosted URL with a temporary key:

```
[+] [AUTH] logged in as YOU#0000
[#] [DASH] [LOCAL] http://192.168.1.42:8484/?pw=void

  [DASH-HOSTED] open: https://void-selfbot.vercel.app/?key=XK7Q2LZP
               key is: XK7Q2LZP  (temporary - changes on restart)
```

- The **local dashboard** (`http://localhost:8484`) works while the CLI is running on your machine.
- The **hosted dashboard** (`https://void-selfbot.vercel.app`) runs from Vercel's CDN and proxies to your running selfbot over an HTTPS polling relay. Paste the printed key into the hosted site and you get full dashboard access from any device/browser without exposing your IP or port-forwarding.

## How the key works

1. When you run `npm start`, the selfbot registers with the Vercel relay using a **random 8-char key** printed in the console (and appended to the hosted URL).
2. Your client long-polls the relay for messages from the dashboard.
3. When you load the hosted site and enter the key, every state/log/command/RPC/nuke click is POSTed to `/api/send`, queued, delivered to your client on its next poll, executed locally, and the reply is posted back.
4. The key is **temporary** - restart the CLI and a new key is generated. State is kept in-memory on the Vercel edge; cold starts invalidate keys (which is why we print a fresh key each time).

## Project structure

```
.
├─ src/
│  ├─ index.js            # Main entry
│  ├─ config.js           # Persistent config (config.json)
│  ├─ logger.js           # Ring-buffered logger w/ broadcast
│  ├─ rpc.js              # Discord Rich Presence
│  ├─ ui.js               # ASCII box art helpers
│  ├─ ascii.js            # ASCII boot banner / glitch banners
│  ├─ boot.js             # Retro progress bar boot sequence
│  ├─ loader.js           # Recursive command + hook loader
│  ├─ dashboard.js        # Local Express+WebSocket dashboard
│  ├─ relay.js            # Vercel relay client (outbound long-poll)
│  ├─ dashboard-relay.js  # Bridges relay messages to the local bot
│  └─ protection/         # ratelimit, antidetect, antinuke, selfguard
├─ commands/
│  ├─ utility/            help, ping, prefix, avatar, userinfo, serverinfo,
│  │                      setstatus, say
│  ├─ presence/           activity, rpc, rpcrotate, statusglitch, fakegame, fakestream
│  ├─ automation/         afk, autoreact, autoreply, bump, keywordreply, logserver
│  ├─ protection/         antinuke, vanityguard, panic, ratelimit, selfguard, backup, whitelist
│  ├─ fun/                8ball, ascii, asciiprofile, bin, flood, hack, leet,
│  │                      llm, matrix, mock, quote, rick, roast, spam, trace
│  ├─ nukes/              nuke, banall, kickall, rolewipe, emojwipe, stickerwipe,
│  │                      channelnuke, renameall, raid, dmall, purge, spamroles,
│  │                      spamchannels, timeoutall, webnuke, rolelock, auditflood,
│  │                      serverrename, iconwipe, massreact, categorykill
│  └─ stealth/            ghostping, snipe, steal, impersonate, spoof, ghosttype,
│                         historywipe, mirror, vanish, tokeninfo, fakeban, nickghost, webwipe
├─ public/                dashboard HTML/CSS/JS (used for both local + Vercel)
├─ api/                   Vercel serverless relay functions (register/poll/reply/send/status)
├─ vercel.json            Vercel routing
└─ README.md, package.json, .env.example, .gitignore
```

## Deploying your own copy of the dashboard to Vercel

The public URL `https://void-selfbot.vercel.app` is the default; to self-host the relay:

1. Fork/push this repo to GitHub.
2. Import it on Vercel (no build step needed; `vercel.json` maps `api/*` as serverless functions and `public/*` as static files).
3. Change `RELAY_URL` in `.env` to point at your deployment's `/api` path, e.g. `https://your-app.vercel.app/api`.
4. The CLI prints `https://your-app.vercel.app/?key=XXXXXXXX` on startup.

## Dashboard tabs (both local and hosted)

1. OVERVIEW   - live stats (ping/uptime/heap/servers/channels/RPC/prefix/mode)
2. RPC        - connect/disconnect + editor for details/state/images/buttons
3. PRESENCE   - prefix, status, activity
4. SERVERS    - guild list
5. PROTECTION - rate limiter slow/fast, antinuke arm/snapshot/rollback, vanity guard, PANIC
6. TERMINAL   - run commands directly in-browser against a chosen channel
7. NUKE PANEL - 18 one-click destructive buttons
8. LOGS       - live streaming logs

Toggle **CRT MODE** in the sidebar for green-on-black scanline retro vibe.

## Protection

- **Smart rate limiter** - per-channel queues with baseline delay + random jitter, realistic sendTyping(), burst detection/slowdown, global 429 backoff, panic flush.
- **Anti-detect** - censors flagged patterns (selfbot/plaintext tokens/\"nuked by\" signatures), silent errors.
- **Anti-nuke** - per-server snapshots, threshold-triggered auto-rollback (deletes webhooks, restores name/icon/channels/roles).
- **Vanity guard** - auto-restores vanity code on change.
- **Selfguard** - re-adds stripped roles; panic hook goes invisible + backups DMs.
- **Panic** (`;panic` or button) - instant invisible, clear activity, halt queues, backup DMs.
- **Whitelist** - users/roles destructive commands should never touch.

## Commands

All commands grouped by category. Default prefix `;` (change via `;prefix` or dashboard). See in-app `;help` for a full box-art listing.

## Note

No protection system is bulletproof. Nuke/raid/dmall on a real account will get you banned if reported.
