# ⬛ VOID — Selfbot v2.0

A completely rewritten Discord selfbot with a **live web dashboard**, built-in Discord Rich Presence controls, AFK/auto-react/auto-reply automation, and a collection of destructive "nuke" commands.

> ⚠️ Selfbots violate Discord's Terms of Service. Use this at your own risk. For educational purposes only.

---

## Features

- 🌀 **Live Web Dashboard** — starts automatically when you launch the bot; printed to console and opened in your browser.
  - Live stats (ping, uptime, heap, servers, channels)
  - RPC connect/disconnect/editor (details/state/images/buttons)
  - Presence controls (status, activity, prefix)
  - Server list
  - Live streaming logs
  - Quick nickname changer per server
- 🎭 **Rich Presence** controls from chat *and* dashboard (via `discord-rpc`, needs the Discord desktop client running).
- 👻 Stealth tools: `ghostping`, `snipe`, `spoof`, `steal`, `impersonate`.
- ⚙️ Automation: `afk`, `autoreact`, `autoreply`, `bump`.
- 💣 Destructive commands: `nuke`, `banall`, `kickall`, `rolewipe`, `emojwipe`, `stickerwipe`, `channelnuke`, `renameall`, `raid`, `dmall`, `purge`, `spamroles`, `spamchannels`, `timeoutall`.
- 💬 Fun: `roast`, `spam`, `8ball`, `llm` (Groq AI).
- 🔮 Utility: `help`, `ping`, `prefix`, `avatar`, `userinfo`, `serverinfo`, `setstatus`, `say`.

---

## Install & run

```bash
cd Void
npm install
cp .env.example .env
# edit .env and fill in TOKEN, OWNER_ID, etc.
npm start
```

On startup you'll see something like:

```
DASH URL  http://192.168.1.42:8484/?pw=void
```

Open that URL in your browser — that's the live dashboard. RPC requires the Discord **desktop client** running on the same machine.

---

## Project structure

```
Void/
├─ src/
│  ├─ index.js        # Entry
│  ├─ config.js       # Persistent config (config.json)
│  ├─ logger.js       # Ring-buffered logger w/ WS broadcast
│  ├─ rpc.js          # Discord Rich Presence controller
│  ├─ loader.js       # Recursive command/hook loader
│  ├─ dashboard.js    # Express + WebSocket dashboard API
│  └─ ascii.js        # VOID banner
├─ commands/
│  ├─ utility/        # help, ping, prefix, avatar, userinfo, serverinfo, say, setstatus
│  ├─ presence/       # activity, rpc
│  ├─ automation/     # afk, autoreact, autoreply, bump
│  ├─ fun/            # roast, spam, 8ball, llm
│  ├─ nukes/          # nuke, banall, kickall, rolewipe, emojwipe, stickerwipe, channelnuke,
│  │                  # renameall, raid, dmall, purge, spamroles, spamchannels, timeoutall
│  └─ stealth/        # ghostping, snipe, steal, impersonate, spoof
├─ public/            # Dashboard frontend (index.html, style.css, app.js)
├─ .env.example
├─ config.json        # Auto-created on first run
└─ package.json
```

---

## Commands quick reference

Default prefix: `;` (change via `;prefix <x>` or the dashboard).

| Category | Commands |
|---|---|
| Utility | `help`, `ping`, `prefix`, `avatar`, `userinfo`, `serverinfo`, `setstatus`, `say` |
| Presence | `activity`, `rpc` |
| Automation | `afk`, `autoreact`, `autoreply`, `bump` |
| Fun | `roast`, `spam`, `8ball`, `llm` |
| Nukes | `nuke`, `banall`, `kickall`, `rolewipe`, `emojwipe`, `stickerwipe`, `channelnuke`, `renameall`, `raid`, `dmall`, `purge`, `spamroles`, `spamchannels`, `timeoutall` |
| Stealth | `ghostping`, `snipe`, `steal`, `impersonate`, `spoof` |

---

## Dashboard

- Runs on `DASH_PORT` (default `8484`), binds `0.0.0.0`, accessible on your LAN.
- Password-protected via `DASH_PASSWORD` (default `void`). The password is auto-appended to the printed URL.
- Live websocket pushes state & logs every 4s.

---

## Notes & warnings

- Selfbots break Discord TOS. Use on throwaway accounts you're willing to lose.
- Nuke commands will get your account banned instantly if reported.
- RPC needs the Discord desktop client running locally; it connects via IPC, not the bot gateway.
- `discord.js-selfbot-v13` is a community-maintained user account library; breakages can happen with Discord API changes.

⬛ **Welcome to the void.**
