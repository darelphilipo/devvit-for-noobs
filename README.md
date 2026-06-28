# Devvit for Noobs

A guide to building apps on Reddit's Devvit platform. Built for humans (and their AI coding agents).

> **40+ repos analyzed. Battle-tested patterns extracted. One reference to rule them all.**

### [**→ Read the Guide**](https://darelphilipo.github.io/devvit-for-noobs/)

## What You'll Learn

This guide takes you from zero to shipping a Devvit app on Reddit. No fluff, no jargon — just the stuff that actually works, learned from analyzing 40+ production apps.

### If you're brand new to Devvit

Start at the top. You'll learn what Devvit is, how to install the CLI, and how to get your first app running in 5 minutes. The guide walks you through the three core building blocks: **Redis** (your free database), **Triggers** (event-driven automation), and **Scheduler** (CRON jobs that run in the background).

### If you know the basics but keep hitting walls

The **Gotchas & Pitfalls** section is where you'll spend the most time. It covers 15+ things that trip up every new Devvit developer — like why `console.log` doesn't show up, why your form is cut off on mobile, why `scheduler.runJob()` never fires, and why your app shows old code after you upload. Each gotcha has a "DO THIS / NOT THIS" format so you can fix it fast.

### If you're building something real

The **Architecture Patterns** section shows you 6 proven patterns from production apps: hybrid backends with CRON, webhook dispatchers, cached modlists, multi-step mobile forms, real-time chat with polling, and event delegation. Each pattern includes the exact code and which apps use it.

The **Redis Deep Dive** covers everything from basic operations to race conditions, TTL patterns, namespacing conventions, and the gotcha where `incr` inside a transaction silently fails.

### If you're ready to publish

The **Production Checklist** has a pre-upload checklist covering code quality, security, Devvit Web specifics, Redis, UI/UX, and testing. It also has the upload/publish steps, a troubleshooting table for common production issues, and the critical reminder to click "Update" on the developer portal after every upload.

### If you want to learn from real apps

The **Community Spotlight** has 20+ open source Devvit apps organized by category: Games, Mod Tools, Community Apps, Libraries, and Bots. Each entry has a one-line description, the pattern to steal, and a link to the source code.

## What's in skills.md

The `skills.md` file is a 2900+ line reference manual for AI coding agents. Feed it to opencode, Claude Code, or Cursor and your AI assistant becomes a Devvit expert instantly. It covers:

- Vibe Coder Quickstart (prerequisites, first app, daily dev loop)
- Full API reference with examples
- 40+ repo patterns verified from actual source code
- Battle-tested production patterns (logging, security, Redis gotchas, iOS Safari gotchas)
- Going to production checklist
- Code templates for bots, mod tools, games, and community apps
- DO THIS / NOT THIS gotcha reference

## Key Things to Know Before You Start

- **Blocks UI is dead.** Removed in v0.13.0. Support ends June 30, 2026. Use `@devvit/web` for ALL new apps.
- **After every upload**, go to developers.reddit.com and click the blue "Update" button. Upload does NOT auto-update installed subreddits.
- **`console.log` doesn't surface** in Devvit Web inline webview. Use server logs (`devvit-cli logs`) or a custom debug panel.
- **The recommended stack** is React 19 + Tailwind CSS 4 + Hono + Framer Motion + Lucide Icons. This is what Reddit's own Community Chats app uses.

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
