# Devvit for Noobs

A retro 8-bit pixel art guide to building apps on Reddit's Devvit platform. Built for humans (and their AI coding agents).

> **40+ repos analyzed. Battle-tested patterns extracted. One reference to rule them all.**

## What's here

| File | Purpose |
|------|---------|
| `index.html` | The educational website — 11 sections with TL;DR boxes, code examples, and gotcha tables |
| `style.css` | Full 8-bit NES/GameBoy pixel art theme (pure CSS, no images) |
| `script.js` | Minimal JS for nav tracking + mobile hamburger |
| `skills.md` | Comprehensive AI agent reference (2900+ lines, feed this to opencode/Claude Code/Cursor) |

## Website Sections

| # | Section | What It Covers |
|---|---------|----------------|
| 00 | Home | TL;DR of the entire guide |
| 01 | What Can You Build | Games, mod tools, community apps |
| 02 | First App in 5 Min | Install CLI → init → dev → upload → publish |
| 03 | The Stack | React 19 + Tailwind 4 + Hono + Redis + @devvit/web |
| 04 | Architecture Patterns | 6 proven patterns from 40+ production apps |
| 05 | Redis Deep Dive | Data types, namespacing, TTL, race conditions |
| 06 | Gotchas & Pitfalls | 15+ things that will save you hours of debugging |
| 07 | Production Checklist | Pre-upload checklist, publish steps, common issues |
| 08 | Blocks Migration | Blocks is dead June 30, 2026 — migrate now |
| 09 | Community Spotlight | 20+ open source apps organized by category |
| 10 | Resources | Community links, Developer Fund, next steps |

## What's in skills.md

The `skills.md` file is a 2900+ line reference manual for AI coding agents. It covers:

- **Vibe Coder Quickstart** — Prerequisites, first app, daily dev loop
- **Architecture** — Devvit Web, Hono routing, triggers, CRON, Redis
- **API Reference** — All Devvit SDK methods with examples
- **40+ Repo Patterns** — Verified from actual source code (not just READMEs)
- **Battle-Tested Production Patterns** — Logging, security, Redis gotchas, iOS Safari gotchas
- **Going to Production** — Pre-upload checklist, publish steps, troubleshooting
- **Code Templates** — Bot, mod tool, game, and community app templates
- **Gotchas Table** — DO THIS / NOT THIS reference

Feed it to your AI agent:
```
opencode --read skills.md
# or paste it into Claude Code / Cursor
```

## Deploy on GitHub Pages (Free)

1. Push this repo to GitHub
2. Go to **Settings > Pages**
3. Under "Source", select **Deploy from a branch** → `master` → `/ (root)`
4. Click Save
5. Your site is live at `https://yourusername.github.io/devvit-for-noobs/`

That's it. No build step. No npm install. No server. Just push and it's live.

## Local Preview

Open `index.html` directly in your browser. No server needed.

## Key Warnings

- **Blocks UI is dead.** Removed in v0.13.0. Support ends June 30, 2026. Use `@devvit/web` for ALL new apps.
- **After every upload**, go to developers.reddit.com and click the blue "Update" button. Upload does NOT auto-update installed subreddits.
- **`console.log` doesn't surface** in Devvit Web inline webview. Use server logs (`devvit-cli logs`) or a custom debug panel.

## Credits

Built by a Devvit developer who learned the hard way. Not affiliated with Reddit.

Patterns and learnings extracted from 40+ open source Devvit apps including:
[HotAndCold](https://github.com/reddit/devvit-HotAndCold),
[Bot Bouncer](https://github.com/fsvreddit/bot-bouncer),
[ContextMod](https://github.com/StephenSook/context-mod-devvit),
[Meetit](https://github.com/op7418/meetit),
[Appeal Desk](https://github.com/vsenthil7/appeal-desk),
[Devvit-State](https://github.com/foreverest/devvit-state),
[Over9000Games](https://github.com/Strawberry-Computer/over9000games),
and [many more](https://github.com/darelphilipo/devvit-for-noobs).
