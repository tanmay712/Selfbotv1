# [VOID] Selfbot v2.5

A Discord selfbot with a **live web dashboard**, Rich Presence controls, automation, ASCII retro UI, and a massive command set including nukes, stealth, presence, fun and utility.

> [WARNING] Selfbots violate Discord's Terms of Service. Educational use only. Use throwaway accounts.

---

## Quick start

```bash
cd Void
npm install
cp .env.example .env
# edit .env - fill in TOKEN
npm start
```

On boot you'll see a retro progress-bar boot sequence, then a banner and a printed dashboard URL that also auto-opens in your browser.

```
==========================================================
|  __      __       .__           .___    ______   ____   |
| /  \    /  \ ____ |__| ____   __| _/   /  __ \ /_   |  |
...
[#] DASH listening on http://192.168.1.42:8484/?pw=void
```

---

## Dashboard

- Bind `0.0.0.0:DASH_PORT` (default 8484), accessible on your LAN.
- Password gated (`DASH_PASSWORD`, default `void`); the URL is printed with the password pre-filled.
- Tabs:
  1. **OVERVIEW** - live stats (ping, uptime, heap, servers, channels, RPC, prefix)
  2. **RPC** - connect/disconnect + editor for details/state/images/buttons
  3. **PRESENCE** - prefix, status, activity
  4. **SERVERS** - guild list with member/channel counts
  5. **TERMINAL** - type commands directly from the browser; they fire in the selected channel as if you typed them in Discord
  6. **NUKE PANEL** - one-click buttons for all destructive commands
  7. **LOGS** - live streaming logs over WebSocket
- Toggle **CRT MODE** for green-on-black scanline retro terminal vibe.

---

## Project structure

```
Void/
├─ src/          index.js, config.js, logger.js, rpc.js, loader.js,
│               dashboard.js, ascii.js, ui.js, boot.js
├─ commands/
│  ├─ utility/      help, ping, prefix, avatar, userinfo, serverinfo,
│  │                setstatus, say
│  ├─ presence/     activity, rpc, rpcrotate, statusglitch,
│  │                fakegame, fakestream
│  ├─ automation/   afk, autoreact, autoreply, bump, keywordreply, logserver
│  ├─ protection/   antinuke, vanityguard, panic, ratelimit, selfguard,
│  │                backup, whitelist
│  ├─ fun/          8ball, ascii, asciiprofile, bin, flood, hack, leet,
│  │                llm, matrix, mock, quote, rick, roast, spam, trace
│  ├─ nukes/        nuke, banall, kickall, rolewipe, emojwipe, stickerwipe,
│  │                channelnuke, renameall, raid, dmall, purge, spamroles,
│  │                spamchannels, timeoutall, webnuke, rolelock, auditflood,
│  │                serverrename, iconwipe, massreact, categorykill
│  └─ stealth/      ghostping, snipe, steal, impersonate, spoof, ghosttype,
│                   historywipe, mirror, vanish, tokeninfo, fakeban,
│                   nickghost, webwipe
├─ src/protection/ ratelimit.js, antidetect.js, antinuke.js, selfguard.js
├─ public/       dashboard HTML/CSS/JS
└─ README.md, package.json, .env.example, .gitignore
```

69 unique commands, 110 including aliases. Zero Unicode emojis in output - everything uses ASCII box art and markers: `[+]`, `[X]`, `[!]`, `[i]`, `[>]`, `[#]`.

---

## Commands

Default prefix: `;` (change via `;prefix` or dashboard).

### Utility
| Command | What |
|---|---|
| `help` | ASCII-box command list grouped by category |
| `ping` | gateway + RTT latency box |
| `prefix <x>` | change prefix |
| `avatar [user]` | avatar URL |
| `userinfo [user]` | key/value info box |
| `serverinfo` | server info box |
| `setstatus <online/idle/dnd/invisible>` | status |
| `say <msg>` | say something as self (deletes trigger) |

### Presence
| Command | What |
|---|---|
| `activity <TYPE> <text>` | PLAYING/STREAMING/LISTENING/WATCHING/COMPETING |
| `rpc ...` | connect/disconnect/details/state/image/buttons/clear |
| `rpcrotate ...` | rotate RPC lines on a timer |
| `statusglitch <on/off> [sec]` | rapidly flip status |
| `fakegame <on/off> [sec]` | cycle fake game activities |
| `fakestream <url> [title]` | fake "Streaming" status |

### Automation
| Command | What |
|---|---|
| `afk [reason]` | auto-reply to mentions/DMs; ping-back on return |
| `autoreact <on/off/add/remove/list>` | react on keywords |
| `autoreply <on/off/set>` | auto-reply DMs/mentions with preset |
| `keywordreply <on/off/add/remove/list>` | reply per-keyword triggers |
| `bump <on/off>` | auto /bump loop for disboard |
| `logserver <on/off> [channel]` | log every message to a file in `logs/` |

### Protection (anti-ban / anti-nuke)
All protection modules are loaded automatically and armed on startup. Use these commands to control them, and the [*] PROTECTION tab in the dashboard for one-click control.

| Command | What |
|---|---|
| `antinuke <on/off/snapshot/rollback/config>` | **Anti-nuke auto-rollback.** Takes a snapshot of channels/roles/name/icon, watches mass-delete events, and triggers automatic rollback if thresholds are exceeded within a short window. Thresholds, rollback scope, etc. are configurable per-server. |
| `vanityguard <on/off/set/status>` | Detect vanity URL changes and automatically restore the locked vanity code. |
| `ratelimit <set/slow/fast/status>` | Configure the smart outbound rate limiter: per-channel delays + random jitter + typing simulation + global 429 cooldown handling to avoid self-bot detection patterns. `slow` engages ultra-safe slow mode. |
| `selfguard <arm/disarm/status>` | Self-account protection: tries to re-add roles stripped from you, arms panic hook. |
| `panic` | **Emergency button.** Go invisible instantly, clear activity, flush all outbound queues, backup all open DMs to `data/backups/`, halt spam/raids mid-flight. |
| `backup` | Manual full server backup (channels/roles/bans/emojis) -> `data/manual-backups/` |
| `whitelist <adduser/rmuser/addrole/rmrole/list>` | Whitelist users/roles that destructive commands should skip (loaded by other commands). |

**What the rate limiter does automatically:**
- Every outbound `channel.send` (and bulkDelete) gets routed through a per-channel queue with baseline delay + random jitter, so messages don't all fire at once (the #1 self-bot detection fingerprint).
- Sends realistic "typing..." bursts before each message, duration proportional to delay.
- Listens for HTTP 429 responses and backs off globally for `Retry-After`.
- Detects bursts (>5 messages in 5s in one channel) and auto-slows by 3x.
- Panic mode (triggered manually or by selfguard) kills all queues instantly.
- Censors flagged substrings (`selfbot`, plaintext tokens, "nuked by" signature strings) before sending.

**What antinuke does automatically:**
- Takes snapshots of server structure on arm, on startup, and every 30 minutes.
- Watches `channelDelete`, `roleDelete`, `guildBanAdd`, `webhookUpdate` events. If rate exceeds thresholds in a 20s window (defaults: 5 channels, 4 roles, 8 bans, 3 webhooks) it triggers lockdown:
  1. Deletes all webhooks in the server (stops webhook raids instantly).
  2. Restores server name/icon/banner from snapshot.
  3. Deletes channels not in snapshot (if any were created during raid).
  4. Recreates deleted channels/roles by name/position.
- Vanity guard polls every 2 minutes and attempts to reset vanity code if changed.

### Fun
| Command | What |
|---|---|
| `8ball <question>` | ask the void |
| `ascii <text>` | render big 5-line ASCII letters |
| `asciiprofile [user]` | render a user card as ASCII box |
| `bin <text>` | paste to paste.rs, return URL |
| `flood [height]` | ASCII void-gradient wall |
| `hack <user>` | fake movie-hack sequence w/ progress bars |
| `leet <text>` | 1337sp34k |
| `llm <question>` | Groq AI chat (needs GROQ_API_KEY) |
| `matrix [lines]` | Matrix-rain animation |
| `mock <text>` | sPoNgEcAsE |
| `quote` | random void quote |
| `rick <user>` | disguised rickroll |
| `roast <user>` | void roast |
| `spam <n> <msg> / stop` | spam |
| `trace <user>` | fake IP traceroute |

### Nukes (DESTRUCTIVE)
| Command | What |
|---|---|
| `nuke` | delete all channels, rebuild one #void |
| `banall` | ban every bannable member |
| `kickall` | kick every kickable member |
| `rolewipe` | delete all roles except @everyone |
| `emojwipe` | delete all emojis |
| `stickerwipe` | delete all stickers |
| `channelnuke` | delete all channels (no rebuild) |
| `renameall [name]` | rename every member |
| `raid <n> <msg>` | spam message across all channels n times |
| `dmall <msg>` | DM every member |
| `purge <n>` | bulk delete up to 100 messages |
| `spamroles [n]` | create garbage roles |
| `spamchannels [n]` | spam-create text channels |
| `timeoutall <mins>` | timeout everyone |
| `webnuke <n> <msg>` | spawn webhooks on every channel and blast |
| `rolelock` | deny SEND_MESSAGES for @everyone on every channel |
| `auditflood [n]` | spam create/delete roles+channels to bury audit |
| `serverrename <on/off>` | rapid server-name cycling |
| `iconwipe` | remove server icon/banner/splash |
| `massreact [msgId]` | burst of reactions on a message |
| `categorykill` | delete every category |

### Stealth
| Command | What |
|---|---|
| `ghostping [channel]` | @everyone then instantly delete |
| `snipe [edit]` | reveal last deleted/edited message |
| `steal <user>` | steal someone's avatar as your own |
| `impersonate <user>` | clone nick + avatar in the server |
| `spoof <user> <msg>` | send a message as the user via webhook |
| `ghosttype <on/off> [ch]` | permanent "typing..." indicator |
| `historywipe [channel/guild]` | delete your own messages with progress |
| `mirror <on/off> <user>` | auto-repeat everything a user says |
| `vanish [leave]` | scrub your messages and optionally leave |
| `tokeninfo <token>` | locally decode a Discord token (userid + created) |
| `fakeban <user> [reason]` | send a fake ban-notice DM |
| `nickghost <on/off>` | rapidly flicker nickname |
| `webwipe [channel/server]` | delete every webhook |

---

## Notes
- RPC requires the Discord **desktop client** running locally (it connects via IPC).
- Nuke commands are extremely destructive and will instantly terminate your account if reported.
- The terminal tab and nuke panel fire commands by sending synthetic messages to the selected text channel (via WebSocket), so they behave exactly as if you typed them yourself in Discord.
- Logs go to both console and the dashboard logs tab, persisted in an in-memory ring buffer.
