# Devvit App Development â€” LLM Agent Skills Reference

> **Purpose:** Comprehensive reference for coding agents and vibe coders to build Reddit Devvit apps. Covers architecture, Redis, triggers, schedulers, bridges, game integration, MCP, Stitch, and 40+ repo patterns.
> ⚠️ **CRITICAL: Blocks UI removed in v0.13.0. Support ends June 30, 2026. All new apps MUST use Devvit Web (`@devvit/web`). See [Blocks Migration](#-blocks-ui-deprecated---migrate-to-devvit-web) below.**
>
> **Quality standard:** All repo patterns in this document MUST be verified against actual source code — not just READMEs or surface descriptions. If only README-level research was done, the entry is marked with `(surface-level)`. Unverified repos are flagged until deep analysis confirms the patterns.

---

## 1. Vibe Coder Quickstart Guide

### Prerequisites
- Node.js v22.2.0+, VS Code, Reddit account, GitHub account
- Install CLI: `npm install -g @devvit/cli` (on Windows: `devvit-cli`, NOT `devvit`)
- ⚠️ **Blocks UI is END OF LIFE.** Removed from `@devvit/public-api` in v0.13.0. Support drops from all Reddit clients **June 30, 2026**. All NEW apps must use **Devvit Web** (`@devvit/web`). Existing Blocks apps must migrate before the deadline.

### Creating Your First App
```powershell
# Option A: CLI wizard
devvit-cli init
# Select template: "React" (games/full apps) or "Bare" (mod tools)

# Option B: Web flow
# Go to https://developers.reddit.com/new - choose template - complete OAuth
```

### Project Structure
```
my-app/
â”œâ”€â”€ devvit.json          # App config (triggers, scheduler, permissions, entrypoints)
â”œâ”€â”€ package.json
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ client/          # Frontend HTML/React
â”‚   â”œâ”€â”€ server/          # Backend (Express/Hono + Redis + Reddit API)
â”‚   â””â”€â”€ shared/          # Shared types
â”œâ”€â”€ public/              # Static assets
â””â”€â”€ webroot/             # Built output
```

### Daily Dev Loop
```powershell
npm run dev                                    # Start dev mode (creates test subreddit)
npx devvit logs r/your_test_subreddit         # View logs for debugging
npx devvit upload --bump patch --copy-paste   # Upload new version
# CRITICAL: After upload, go to https://developers.reddit.com/apps/your-app
# Click the BLUE "Update" button next to "My Installations" or old code runs!
```

### Design with Stitch
1. Create a Stitch project (use stitch tools in opencode)
2. Generate screens with text prompts describing your UI
3. Export HTML/CSS, drop into `public/` or `src/client/`
4. Pro tip: Neo-Brutalist (hard shadows, neon colors, Space Grotesk font) works great on Reddit

### Wire Up Backend (Express Pattern)
```typescript
// src/server/index.ts
import express from 'express';
import { createServer, context, redis, reddit, getServerPort } from '@devvit/web/server';

const app = express();
app.use(express.json());
const router = express.Router();

// Client API endpoints (callable from frontend)
router.get('/api/data', async (req, res) => {
  const data = await redis.get('my-key');
  res.json({ data });
});

// Internal endpoints (scheduler, menu actions)
router.post('/internal/scheduler/my-job', async (req, res) => {
  res.json({ status: 'ok' });
});

// Menu actions
router.post('/internal/menu/my-action', async (req, res) => {
  res.json({ showToast: 'Done!' });
});

app.use(router);
const server = createServer(app);
server.listen(getServerPort());
```

### Sample devvit.json
```json
{
  "name": "my-app",
  "server": { "dir": "dist/server", "entry": "index.cjs" },
  "post": {
    "entrypoints": {
      "default": {
        "entry": "index.html",
        "height": "regular",
        "inline": true
      }
    }
  },
  "scheduler": {
    "tasks": {
      "my-job": {
        "endpoint": "/internal/scheduler/my-job",
        "cron": "0 * * * *"
      }
    }
  },
  "menu": {
    "items": [
      {
        "label": "My Action",
        "location": "post",
        "forUserType": "moderator",
        "endpoint": "/internal/menu/my-action"
      }
    ]
  },
  "permissions": {
    "http": { "enable": true },
    "redis": { "enable": true },
    "reddit": { "enable": true, "scope": "moderator" }
  }
}
```

### Version Management
```powershell
npx devvit upload --bump patch       # Private upload for testing
npx devvit publish --bump minor      # Publish for review
npx devvit install r/another_sub     # Install on another subreddit
npx devvit whoami                    # Check current login
npx devvit login                     # Re-login if needed
```

### Test on Mobile & Web
| Platform | How to Test |
|----------|-------------|
| Desktop Web | Open playtest URL, refresh to see changes |
| Mobile Reddit App | Open playtest URL in Reddit app, go to subreddit |
| UI Simulator | `npx devvit ui-simulator` for layout testing |

### Critical Mobile Fixes
- Inline webviews CANNOT scroll internally on mobile - break forms into steps (max 2 fields/step)
- Add floating scroll arrows for longer content
- `onclick` handlers blocked by CSP - use `addEventListener`
- Test at iPhone SE width (375px)

---

## 2. Architecture Decision Tree

> **WARNING:** `@devvit/public-api` (Blocks) is REMOVED in v0.13.0. Support ends June 30, 2026. ALL new apps must use **Devvit Web** (`@devvit/web`). See [Blocks Migration](#-blocks-ui-deprecated---migrate-to-devvit-web) above.

```
What are you building?

  Mod Tool — Use "React" template (or mod-tool-devvit-web template)
    ← devvit.json triggers + menu actions + Redis + optional Webview UI
    ← No Blocks needed — use /internal/* endpoints for menu actions

  Game — Use "React" / "Phaser" / "Three.js" / "Unity" template
    ← Devvit Web (React + Vite) + Redis + Scheduler. Client/Server split with HTTP API.
    ← PixiJS 8 + React 19 (official prisma-game example)

  Notification Bot — Use "React" template (minimal UI)
    ← Triggers + HTTP fetch (webhooks). Single devvit.json + server file is fine.

  Community App — Use "React" template
    ← Devvit Web (React + Tailwind 4 + Hono) + Redis + Scheduler + optional Realtime
    ← Full client/server with tRPC or Hono routing

  Data/Utility Library — Monorepo (npm workspaces)
    ← packages/my-lib/ (pure TS) + packages/my-devvit/ (thin Devvit wrapper)
```

### Official Templates (as of June 2026)
| Template | Stack | Use Case |
|----------|-------|----------|
| [React starter](https://github.com/reddit/devvit-template-react) | React 19, Vite, Hono, Tailwind 4, tRPC v11 | General web apps (recommended for most apps) |
| [Three.js starter](https://github.com/reddit/devvit-template-threejs) | Three.js, Vite, Express | 3D games/visualizations |
| [Phaser starter](https://github.com/reddit/devvit-template-phaser) | Phaser, Vite, Express | 2D games (physics, animations, sound) |
| [Unity starter](https://github.com/reddit/devvit-template-unity) | Unity WebGL | Large-scale 3D games |
| [GameMaker starter](https://github.com/reddit/devvit-template-gamemaker) | GameMaker HTML5 | 2D games via GameMaker |
| [Payments template](https://github.com/reddit/devvit-template-payments) | Devvit Web | In-app purchases boilerplate |
| [Mod tool (Web)](https://github.com/reddit/devvit-template-mod-tool-devvit-web) | Hono, Vite, TypeScript | Mod tools with Devvit Web (instead of Blocks) |

### Inline vs Expanded
| Aspect | Inline (default) | Expanded |
|--------|------------------|----------|
| Behavior | Loads directly in post | Shows "Launch App" button |
| Use for | Games, simple tools | Complex apps with large UIs |
| External requests | Blocked from client | Allowed |
| Mobile scrolling | Cannot scroll internally | Can scroll |
| `inline` property in devvit.json | **Deprecated** (always implied) | N/A |

---

## 3. File Organization Patterns

**Pattern A: Single-file (< 200 lines)**
- `src/main.ts` - Everything: configure + triggers + logic
- Use for: Simple notification bots, webhook forwarders

**Pattern B: 4-6 file separation**
```
src/main.ts      # Entry: configure, register triggers/menu
src/handlers.ts  # Trigger handlers + business logic
src/storage.ts   # Redis read/write wrappers
src/settings.ts  # Settings form definitions + validators
src/types.ts     # TypeScript interfaces
src/constants.ts # Magic numbers, enums for job names
```
- Use for: Mod tools, bots with settings

**Pattern C: Full client/server split**
```
src/client/      # Frontend: HTML/React, game logic, UI components
src/server/      # Backend: API routes, Redis, Reddit API, scheduler
  routes/  services/  devvit/redis/  devvit/triggers/
src/shared/      # Shared TypeScript types
```
- Use for: Games, community apps, complex UIs

**Pattern D: Monorepo (npm workspaces)**
```
packages/
  my-lib/        # Pure TypeScript (zero Devvit deps)
  my-devvit/     # Devvit wrapper (imports lib + @devvit/public-api)
```
- Use for: Reusable libraries published to npm

### Non-Negotiable Rules for All Projects
- Server builds MUST output CJS (CommonJS), client to ESM
- Use `@devvit/web/server` imports for server code — `@devvit/public-api` is Blocks-only (removed)
- Routes: `/api/*` = client calls, `/internal/*` = triggers/scheduler/menu
- NEVER use `onclick` attributes in HTML - always `addEventListener`
- Always include hardcoded fallback data in HTML for instant rendering
- Redis writes are eventually consistent - don't immediately verify writes
- Use `fetch('/api/...')` for client→server — NOT `window.parent.postMessage`
- Never fetch `reddit.com/r/.../.json` unauthenticated (blocked since May 28, 2026)
- Design for Logged Out Users — show `showLoginPrompt()` for gated features

---

## 4. Server Architecture Patterns

### Available Server APIs (`@devvit/web/server`)
| API | Import | Usage |
|-----|--------|-------|
| `redis.get/set/hGetAll/hSet/hDel/zAdd/zCard/zScore/zRem/zRange` | `@devvit/web/server` | Data persistence |
| `reddit.submitCustomPost/getModerators/getCommentById/sendPrivateMessage` | `@devvit/web/server` | Reddit actions |
| `context.username/subreddit/postId/postData` | `@devvit/web/server` | Request metadata |
| `scheduler.runJob` | `@devvit/web/server` | Schedule jobs |
| `settings.get(key)` | `@devvit/web/server` | Read settings |
| `getServerPort()` | `@devvit/web/server` | Auto-detect port |
| `media.upload({url, type})` | `@devvit/web/server` | Upload images (20MB max, PNG/JPEG/WEBP/GIF) |
| `realtime.send(channel, msg)` | `@devvit/web/server` | Push live events to webview clients |

### Available Client APIs (`@devvit/web/client`)
| API | Import | Usage |
|-----|--------|-------|
| `navigateTo(url)` | `@devvit/web/client` | Navigate in Reddit browser |
| `showToast({text, appearance})` | `@devvit/web/client` | Show toast notification |
| `showForm({title, fields})` | `@devvit/web/client` | Show Devvit form dialog |
| `showShareSheet({title, text})` | `@devvit/web/client` | Native share sheet |
| `showLoginPrompt()` | `@devvit/web/client` | Prompt user to log in |
| `getWebViewMode()` | `@devvit/web/client` | Detect inline vs expanded mode |
| `requestExpandedMode()` | `@devvit/web/client` | Request full-size iframe |
| `connectRealtime({channel, onMessage})` | `@devvit/web/client` | Subscribe to Realtime channel |

### NOT Available in Devvit Web
- `reddit.modMail.createConversation()` - Not available
- `scheduler.on("name", handler)` - Does not exist; use endpoint-based scheduler instead
- `settings.get()` without args - Returns undefined; always pass key
- `window.parent.postMessage` - Not needed; use `fetch('/api/...')` instead
- `addCustomPostType()` - Removed entirely. Use `devvit.json` entrypoints

### UiResponse Pattern — Server Returns Declarative UI (Community Chats)
Instead of client-side routing, the server returns `UiResponse` objects. The Devvit platform renders the UI:
```typescript
// Server returns what the platform should show
if (!isMod) {
  return c.json<UiResponse>({ showToast: { text: "Mods only.", appearance: "neutral" } });
}
return c.json<UiResponse>({
  showForm: { name: 'myForm', form: { fields: [{ type: 'string', name: 'title', required: true }] } }
});
// Or navigate: { navigateTo: 'https://reddit.com/r/...' }
```
Types: `showToast`, `showForm`, `navigateTo` — all declarative. The platform handles rendering.

### getModPermissionsForSubreddit() — Reliable Mod Detection (Community Chats)
More reliable than `getModerators()` in Devvit Web inline context:
```typescript
const user = await reddit.getCurrentUser();
const perms = await user.getModPermissionsForSubreddit(subredditName);
const isModerator = perms && perms.length > 0;
```
Cache result in Redis with 1-minute TTL to avoid calling on every request.

### Ban Detection on Every Message (Community Chats)
```typescript
const bannedUsers = await subreddit.getBannedUsers({ username }).all();
if (bannedUsers.length > 0) {
  return c.json({ status: 'error', message: 'You are banned.' }, 403);
}
```

### Hono Middleware Auth Guard (Reddit Copilot)
Protect ALL API routes with a single middleware — no per-endpoint auth checks:
```typescript
// Hono middleware runs before every request
api.use('*', async (c, next) => {
  const isModerator = await isCurrentUserModerator();
  if (!isModerator) {
    return c.json({ status: 'error', message: 'Moderator access required' }, 403);
  }
  await next(); // Only mods get past here
});
```
This pattern eliminates scattered `isMod` checks across every endpoint. Use `api.use('/admin/*', middleware)` for partial protection.

### Cascading Analysis Pipeline — Heuristic First, LLM as Fallback (SpoilerSenser)
```typescript
function analyze(content) {
  // Step 1: Fast heuristic scan (regex, keyword matching) — zero cost
  const heuristicResult = runHeuristics(content);
  if (heuristicResult.confidence === 'HIGH') return heuristicResult; // Skip LLM
  if (heuristicResult.confidence === 'LOW' && !heuristicResult.ambiguous) return heuristicResult; // Skip LLM

  // Step 2: Only call LLM when heuristic is ambiguous
  const llmResult = await callLLM(content);
  return llmResult; // Expensive call, but only when necessary
}
```
Saves 80%+ API costs by filtering obvious cases heuristically before hitting expensive AI APIs.

### External Edge Worker Integration (HumanDefender)
Offload heavy compute to Cloudflare Workers with graceful degradation:
```typescript
try {
  const resp = await fetch(`${WORKER_URL}/analyze`, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000), // Hard timeout prevents Devvit execution limit
  });
  if (resp.ok) result = await resp.json();
} catch {
  // Edge worker down → signals default to 0. App keeps working.
}
```

### Offline Tile Maps in CSP-Restricted iframes (Reddit-Map)
Devvit's CSP blocks external images (`img-src 'self'`). Pre-download map tiles as build-time assets:
```typescript
// Build script: download OSM tiles covering city bbox at zoom 11-13
// Store in public/maps/{z}/{x}/{y}.png
// At runtime, Leaflet loads from same origin:
L.tileLayer('/maps/{z}/{x}/{y}.png', { minZoom: 11, maxZoom: 13 }).addTo(map);

// Pin click navigates via Devvit's navigateTo (not window.location):
marker.on('click', () => navigateTo(`https://www.reddit.com${pin.permalink}`));
```
Also validates LLM coordinates against city bounding boxes to reject hallucinated locations.

### Scheduler Escape Hatch for Devvit Timeouts (Reddit-Map)
Triggers time out after seconds. For minutes-long work, schedule a background job:
```typescript
// Trigger returns immediately, real work runs in scheduler
await scheduler.runJob({
  name: 'backfill',
  runAt: new Date(Date.now() + 5000), // 5-second delay
  data: { sub, cityNames },
});
return c.json({ status: 'success', message: 'Scanning in background...' });
```

### Devvit Realtime Pub/Sub (ModarBot)
Push live events from server to webview without polling:
```typescript
// Server: push event to channel
await realtime.send(channelFor(sub), { type: 'anomaly', payload: event });

// Client: subscribe to channel
connectRealtime(channelFor(sub), (message) => {
  setAlerts(prev => [message.payload, ...prev]); // Live push
});
```

### Idempotent Reward System (ModKudos)
Prevent double-rewarding with Redis key + 30-day TTL:
```typescript
const idemKey = `reward:${username}:${contentId}:${rewardType}`;
if (await redis.exists(idemKey)) return; // Already rewarded
await redis.set(idemKey, 'true', { expiration: addDays(new Date(), 30) });
await applyReward(user, rewardType);
```

### Four-Tier Safety Gate (ContextMod)
Before any real moderation action fires:
```typescript
if (!eventProcessingEnabled) return;          // 1: Global gate
if (actionRuntime.dryRun) { logAudit(); return; } // 2: Dry run mode
if (!action.enable) return;                   // 3: Action disabled
if (action.dryRun) { logAudit(); return; }     // 4: Action-level dry run
await executeAction(action, target);           // FIRE
```

### Server Frameworks
- **Express**: Most common, manual routing with `express.Router()`
- **Hono**: Used in React template, lighter weight
- **tRPC**: Used in HotAndCold for type-safe RPC over `/api`

### Recommended Libraries (Production Stack from Community Chats)
This is the stack Reddit's own Community Chats app uses — production-grade, works on Devvit Web:
```json
{
  "dependencies": {
    "@devvit/start": "0.12.x",    // Vite plugin + Devvit tooling
    "@devvit/web": "0.12.x",      // Server + Client APIs
    "hono": "^4",                 // Lightweight HTTP framework (over Express)
    "react": "19.x",              // UI framework
    "react-dom": "19.x",
    "tailwindcss": "4.x",         // CSS framework (v4 — CSS-first config, no tailwind.config)
    "@tailwindcss/vite": "4.x",   // Tailwind Vite plugin
    "framer-motion": "^12",       // Animations (spring physics, layout transitions)
    "lucide-react": "^1",         // Icon library (tree-shakeable)
    "clsx": "^2",                 // Conditional classnames
    "tailwind-merge": "^3"        // Merge Tailwind classes without conflicts
  },
  "devDependencies": {
    "typescript": "5.x || 6.x",
    "vite": "5.x || 8.x",
    "@vitejs/plugin-react": "^6",
    "eslint": "^10",
    "prettier": "^3",
    "prettier-plugin-tailwindcss": "^0.8"
  }
}
```
| Library | Why | Notes |
|---------|-----|-------|
| **Hono** over Express | Lighter, faster, better TS support | Express also works fine |
| **Tailwind 4** | CSS-first config via `@theme`, no JS config file | Use `@tailwindcss/vite` plugin |
| **Framer Motion** | Spring animations, `AnimatePresence` for exit animations | Adds ~30KB to bundle |
| **Lucide React** | Tree-shakeable icons, consistent pixel-perfect sizing | Import only icons you use |
| **clsx + tailwind-merge** | Conditional classes without style conflicts | Standard combo in Tailwind apps |

### Community Library Ecosystem (from 40+ repos)

**Framework split across production apps:**
| Framework | Used By | When |
|-----------|---------|------|
| `@devvit/public-api` (Blocks API) | bot-bouncer, only-flairs, user-scorer, mod-mentions, admin-tattler, sub-stats-bot, automodmail, modmail-userinfo, evasion-guard, bot-reply-msg, modmail-to-discord | Mod tools, bots, simple trigger apps |
| `@devvit/web` (Devvit Web) | community-chats, HotAndCold, microlympics, template-react, template-bare, template-phaser, template-threejs | Games, community apps, full client/server apps |

**Universal utilities (appear in almost every repo):**
| Library | Used By | Purpose |
|---------|---------|---------|
| `date-fns` | bot-bouncer, sub-stats-bot, automodmail, modmail-userinfo, evasion-guard | Date manipulation (`addSeconds`, `subDays`, `formatDistanceToNow`) |
| `vitest` | ALL repos | Testing framework (every repo uses it) |
| `json2md` | bot-bouncer, sub-stats-bot, automodmail, modmail-userinfo, evasion-guard | Convert JSON to markdown for modmail formatting |
| `pako` | bot-bouncer, toolbox-storage | Compression (`deflate` + base64 for large Redis payloads) |
| `lodash` | bot-bouncer, sub-stats-bot, automodmail, modmail-userinfo | Utilities (`compact`, `chunk`, `merge`) |
| `ajv` | bot-bouncer, automodmail | JSON Schema validation for config/settings |

**Mod tool / automation specific:**
| Library | Used By | Purpose |
|---------|---------|---------|
| `yaml` | automodmail, modmail-to-discord | YAML rule parsing |
| `pluralize` | sub-stats-bot, automodmail, modmail-userinfo, evasion-guard | Grammar utilities for messages |
| `escape-string-regexp` | bot-bouncer | Safe regex construction |
| `redos-detector` | bot-bouncer | Regex denial-of-service protection |
| `markdown-escape` | bot-bouncer | Escape markdown in user-generated content |
| `cron-parser` | sub-stats-bot | Parse cron expressions |
| `semver` | bot-bouncer | Version comparison for upgrade detection |

**AI / advanced features:**
| Library | Used By | Purpose |
|---------|---------|---------|
| `openai` | bot-bouncer, HotAndCold | AI content analysis, summary generation |
| `@google/genai` | HotAndCold | Google Gemini integration |
| `sqlite-vec` | devvit-mcp, HotAndCold | Vector search for embeddings |
| `better-sqlite3` | devvit-mcp | Fast SQLite for local doc storage |
| `ioredis` | HotAndCold | Advanced Redis operations |
| `pg` | HotAndCold | Postgres database |
| `playwright` | HotAndCold | Browser automation testing |
| `posthog-js` | HotAndCold | Product analytics |
| `zod` | HotAndCold, mwood23-webview-react | Schema validation |

**Game / visual libraries:**
| Library | Used By | Purpose |
|---------|---------|---------|
| `phaser` | template-phaser-devvit, template-phaser | 2D game engine |
| `three` | template-threejs | 3D engine |
| `framer-motion` | community-chats, mwood23-webview-react | React animations, layout transitions |
| `lucide-react` | community-chats, GameSlideShow | Tree-shakeable icons |
| `motion` (Framer Motion v12) | mwood23-webview-react | Animation library |
| `svelte` | devvitsvelte | Svelte 5 framework (alternative to React) |
| `recharts` | devvit-journey-insights | Chart library for analytics dashboards |
| `@google/generative-ai` | Reddit-Copilot, llmphysics-bot | Google Gemini AI for content analysis |

**Testing / tooling libraries:**
| Library | Used By | Purpose |
|---------|---------|---------|
| `@devvit/test` | devvitsvelte | Devvit-specific test utilities (Redis + Post mocks) |
| `@devvit/analytics` | devvit-journey-insights | Journey event tracking for analytics |
| `playwright` | HotAndCold | Browser automation testing |
| `concurrently` | devvitsvelte, community-chats | Run vite watch + devvit playtest in parallel |
| `bun` (package manager) | devvitsvelte | Alternative to npm/yarn, faster installs |

**Reusable helper libraries (published to npm or GitHub):**
| Library | Used By | Purpose |
|---------|---------|---------|
| `devvit-helpers` | automodmail, modmail-userinfo, bot-bouncer | Shared Devvit utilities (validators, Reddit API wrappers) |
| `@fsvreddit/fsv-devvit-helpers` | sub-stats-bot, automodmail, modmail-userinfo, evasion-guard | fsvreddit's shared helpers (dedup, raw API access) |
| `@fsvreddit/fsv-devvit-web-helpers` | (NEW) | Devvit Web-specific helpers (HTTP middleware, Realtime, cached mod checks) |
| `toolbox-devvit` | modmail-userinfo | Toolbox wiki-as-database integration |
| `devvit-state` | (NEW) foreverest | Atomic versioned state sync with Redis + Realtime + Zod |
| `@devvit/kit` | Official Reddit | UI components (Columns, Pagination, DevToolbar) |

**New fsvreddit repos (Apr–Jun 2026):**
| Repo | Description | Pattern | Status |
|------|-------------|---------|--------|
| `yt-infoapp` | Posts YouTube video info comments | Content enrichment (beyond pure moderation) | surface-level |
| `modmailtranslate` | Inline modmail translation | Multi-language mod tool | surface-level |
| `deapprover` | Undoes post approvals | Reverse-action mod tool | surface-level |
| `appeal-advisor` | Appeal handling (early stage) | User appeal workflow | surface-level |
| `fsv-devvit-helpers` | General helpers extracted from apps | Modularization: extract shared libs | surface-level |
| `fsv-devvit-web-helpers` | Web-specific helpers | Devvit Web middleware pattern | surface-level |

### Devvit-Specific Imports
```typescript
// Server (src/server/) — available as magical imports
import { context, redis, reddit, realtime, media } from '@devvit/web/server';
import type { UiResponse, TriggerResponse } from '@devvit/web/shared';

// Client (src/client/) — browser-safe Devvit APIs
import { getWebViewMode, requestExpandedMode, showForm, showToast, navigateTo, showShareSheet, showLoginPrompt, connectRealtime } from '@devvit/web/client';

// Build tooling
import { devvit } from '@devvit/start/vite';  // Vite plugin
import { getServerPort, createServer } from '@devvit/web/server';  // Server boot

// Official UI components
import { Columns, ItemPagination, DevToolbar } from '@devvit/kit';
```

---

## ⚠️ Blocks UI Deprecated — Migrate to Devvit Web

**Blocks was removed from `@devvit/public-api` in v0.13.0 (May 26, 2026). Support ends on ALL Reddit clients June 30, 2026.**

### What Changed
| Old (Blocks / public-api) | New (Devvit Web) |
|---------------------------|-------------------|
| `Devvit.addCustomPostType(...)` | Removed. Use `@devvit/web` entrypoints in `devvit.json` |
| `useWebView(...)` | Removed. Use `fetch('/api/...')` HTTP calls |
| `useChannel(...)` / `realtime.send(...)` | `@devvit/web/server` only — `realtime.send(channel, msg)` |
| `Devvit.addMenuItem({onPress: showForm})` | `devvit.json` menu items with `/internal/menu/` endpoints |
| `Context.kvStore` | Removed. Use `redis.get/set` directly |
| `@devvit/payments` (Blocks hooks) | Removed. Web-only payments via devvit.json |
| `@devvit/security` | Package removed entirely |
| `@devvit/pushnotif` | Package removed. Use `@devvit/notifications` (experimental) |
| `splash`/`loading` in `submitCustomPost()` | Removed. Use dedicated entrypoint HTML pages |
| `inline` property in devvit.json | Deprecated (always implied now) |

### Migration Steps
1. Create new app with `devvit-cli init` → select "React" template
2. Move server logic to `src/server/` with Express/Hono routes
3. Move UI to `src/client/` with React + Tailwind
4. Define triggers + menu items + scheduler in `devvit.json`
5. Replace `postMessage` bridge with `fetch('/api/...')` HTTP calls
6. Test on mobile AND desktop before the June 30 deadline

---

## Devvit v0.13 — Latest Platform Capabilities (v0.13.3, June 8, 2026)

> Current latest: **v0.13.3** (June 8, 2026). No v0.14 released yet. Next-in-line: v0.13.4-next.

### Push Notifications (`@devvit/notifications` — experimental, gated beta)
```typescript
import { notifications } from '@devvit/notifications';
await notifications.optInCurrentUser();
await notifications.enqueue({
  title: 'Your daily reward!', body: 'Come back and play',
  recipients: [{ userId: 'abc', data: { streak: '5' } }], // Mustache: {{streak}}
});
```
Rate limits: 2/user/day, 25K/app/day. Built-in opt-in/opt-out UX. Requires approval to use.

### Streak System (Redis bitmap-based)
```typescript
// 1 bit per day, 365 bits/year (~46 bytes). Cross-year continuity.
await redis.bitField(`streak:${userId}:2026`, [
  { operation: 'SET', encoding: 'u1', offset: dayOfYear },
  { operation: 'GET', encoding: 'u1', offset: 0 },
]);
```

### Media Uploads + Share Sheets + Logged Out Users
```typescript
import { media } from '@devvit/web/server';
await media.upload({ url: 'https://...', type: 'image' }); // PNG/JPEG/WEBP/GIF, 20MB max

import { showLoginPrompt, showShareSheet } from '@devvit/web/client';
showShareSheet({ title: 'My Score', text: 'I scored 9000!', data: 'abc' });
```

**Logged Out Users** (v0.13.0, stable): Design apps playable without Reddit login. ShowLoginPrompt for gated features. Requires pattern: check auth state, show login CTA for gated content, show limited UI for anonymous users.

### Post Styles + User Actions
```typescript
await reddit.submitCustomPost({ styles: { backgroundColor: { light: '#FFF', dark: '#000' } } });
await post.setCustomPostStyles({ shareImageUrl: 'https://...' });
// runAs: 'USER' now requires app review approval

// iOS/Android height fix: inline webview renders too short on mobile
await reddit.submitCustomPost({ styles: { height: 'TALL' } });
```

### Devvit Journeys (v0.13.0, experimental, gated beta)
Session lifecycle telemetry — tracks user starts, completions, engagement, session frequency/duration:
```typescript
import { journeys } from '@devvit/journeys';
journeys.track({ event: 'level_complete', data: { level: 5, score: 1000 } });
```
**Event Receipts** (v0.13.3): Feedback on telemetry event processing (success/skip/reject/rate-limit).

### Scheduler: Second-Level Cron (experimental)
6-part cron: `*/30 * * * * *` = every 30 seconds.

### Realtime (Devvit Web only, removed from public-api)
```typescript
await realtime.send(channel, msg); // Server. No ':' in channel names.
const conn = connectRealtime({ channel, onMessage }); // Client
```

### Unauthenticated .json Endpoints Blocked (May 28, 2026)
Reddit deprecated unauthenticated `.json` access. `https://reddit.com/r/sub/.json` now returns 403 without auth. Apps that scrape Reddit JSON must:
- Use Devvit's Reddit API (`reddit.getPost()`, `reddit.getComment()`) instead
- Or use OAuth-authenticated requests
- RSS endpoints may be blocked next

### Crosspost Parent ID
New field on `Post` object: `crosspostParentId` identifies original crosspost source.

### New Dependencies Added
| Library | Source | Purpose |
|---------|--------|---------|
| `fast-check` | ModSync, AppealDesk, ModKudos | Property-based testing |
| `ulid` | ModSync | Sortable unique IDs |
| `fast-xml-parser` | Podcast Poster | RSS feed parsing |
| `react-markdown` | Podcast Poster | Markdown rendering in React |
| `node-html-markdown` | Podcast Poster | HTML→markdown conversion |

### Community Pattern Highlights

**Sorted-Set Claim Index (no SCAN in Devvit Redis)** (ModSync):
```typescript
const live = await redis.zRange(claimsIndexKey(sub), cutoff, '+inf', { by: 'score' });
// Each claim: SET with TTL + ZADD to index. Read via zRange, clean via score.
```
Engineering: 180+ tests, 11 fast-check properties, DI with fake Redis, per-step claim refresh, lazy GDPR scrubbing.

**Coordinated-Attack Detection** (FairSift):
SHA-1 fingerprinting: normalize text → hash → check 1-hour Redis window for 3+ distinct-author matches. Unicode property escapes for cross-language.

**Raw Node:HTTP + Custom esbuild (no @devvit/start)** (Podcast Poster):
Manual switch-case routing, 19 RSS host providers, visibilitychange mobile reload hack (Reddit app leaves webview blank after navigateTo on return). 49 commits — most mature.

**Gini Coefficient Workload Imbalance** (Modlytics):
Pure computation engine (zero Devvit imports) with statistical math for burnout detection. Interface-based adapter separates core logic from Devvit runtime.

### New Patterns (June 2026)

**Atomic Versioned State Sync** (devvit-state):
Server-authoritative state with Realtime broadcast + Zod schemas:
```typescript
import { createStore } from 'devvit-state';

// Server: define schema, publish changes
const store = createStore({ schema: z.object({ score: z.number() }) });
await store.publish('game:123', { score: 100 }); // Realtime broadcast

// Client: subscribe and sync
store.subscribe('game:123', (state) => setScore(state.score));
```
Published as npm package (`devvit-state` v0.3.0). Uses Redis transactions + strict versioning + Devvit Realtime.

**AutoMod Visual Workflow** (automod-visualiz):
Interactive DAG-based visualization of AutoMod YAML rules:
- React Flow + Monaco Editor + Zustand + Framer Motion
- Converts YAML → visual workflow graph and back
- `https://github.com/Anxhul10/automod-visualiz`

**Local Dev Proxy (no upload needed)** (devvit-local-dev-template):
```typescript
import { redis, reddit, context } from './devvitProxy';
// Same API as @devvit/web/server — works locally AND on Devvit
// Uses @devvit/test mocks internally. No upload required for every change.
```

**Content Enrichment Bot** (yt-infoapp, fsvreddit): *(surface-level)*
Posts informational comments about YouTube links in threads. Pattern: trigger on PostSubmit/CommentSubmit → detect URL → fetch metadata → reply with summary. New category: content enrichment (beyond moderation).

**Modmail Translation App** (modmailtranslate, fsvreddit): *(surface-level)*
Translates modmail conversations inline. Pattern: trigger on ModMail → detect language → translate → attach translation to dashboard.

**Helper Library Ecosystem** (fsv-devvit-helpers, fsv-devvit-web-helpers):
Two new shared utility packages extracted from the fsvreddit app suite:
- `fsv-devvit-helpers`: General Devvit utilities (validators, Reddit API wrappers, dedup)
- `fsv-devvit-web-helpers`: Devvit Web-specific helpers (HTTP middleware, Realtime helpers, cached mod checks)

**PixiJS 8 + React 19 Combo** (reddit/devvit-prisma-game):
Official Reddit example combining PixiJS 8 canvas rendering with React 19 UI overlay within Devvit Web. Pattern: React wraps PixiJS canvas, server runs Hono API routes for multiplayer state.

**DEFCON RED — Declarative Scenario DSL** (reddit/devvit-defcon-red-game):
Presidential crisis simulator using a declarative scenario DSL + deterministic game loop + optional Gemini AI dialogue. Pattern: Define game scenarios as typed JSON, engine evaluates player choices deterministically.

### Hackathon Apps (Mod Tools & Migration, Apr–May 2026)

These apps were built for the official Reddit hackathon and are published on the Developer Portal:

| App | Creator | What It Does | Pattern |
|-----|---------|-------------|---------|
| **RepostRadar** | MANSWINIPS | One-click repost detection via post menu, ranked duplicates, stickied removal comment | Sorted-set fingerprint index |
| **AI Mod Suite** | AccelerateToTheSingularity | AI rule enforcement, summarization, contributor recognition (Gemini or OpenAI) | Multi-model AI pipeline |
| **ContextMod** | StephenSook | JSON5 rule engine, live telemetry dashboard, dry-run tester, AI explainer (ported from PRAW) | Porting guide: PRAW → Devvit Web |
| **ModPulse** | AstaadDahiya | Real-time community health dashboard, event-driven (zero polling), weekly digests | Trigger-only architecture (no CRON) |
| **My TL;DR** | 0xMarcAurel | AI post summaries via Gemini 2.5 Flash, one-click mod menu → stickied comment | ModMenu + AI on-demand |

### More New Repos & Patterns Discovered (June 2026 — Verified with Source Code Analysis)

> ✅ Patterns below are verified by reading actual source code (not just READMEs). Each includes the exact function/class signatures, line counts, and architecture details found in the codebase.

**Explainable Heuristic Scoring (TriageGuard):**
Priority triage with 0–100 urgency scoring and risk bands (CRITICAL / HIGH / ROUTINE / LIKELY OK):
```typescript
// src/server/engine.ts — 300-line scoring engine (actual weights from source)
interface ScoredItem {
  id: string;
  score: number;       // 0-100 urgency
  band: 'CRITICAL' | 'HIGH' | 'ROUTINE' | 'LIKELY_OK';
  explanations: string[];  // WHY it got this score (surfaced in UI)
}

const WEIGHTS = {
  newAccount:       25,   // Account < 30 days
  highReports:      30,   // 3+ reports in first hour
  watchedDomain:    20,   // Domain on watchlist
  negativeKarma:    15,   // Post/comment karma < 0
  freshAccount:     20,   // Account < 24 hours old
  keywordMatch:     15,   // Body matches watch terms
  lowConfidence:     5,   // Combination of minor flags
};

function scoreUrgency(item: Post | Comment): ScoredItem {
  const reasons: string[] = [];
  let score = 0;
  if (isNewAccount(item.author))    { score += WEIGHTS.newAccount;   reasons.push('New account (+25)'); }
  if (item.reportCount > 3)         { score += WEIGHTS.highReports;  reasons.push('3+ reports (+30)'); }
  if (isWatchedDomain(item.url))    { score += WEIGHTS.watchedDomain; reasons.push('Watched domain (+20)'); }
  if (item.author.karma < 0)        { score += WEIGHTS.negativeKarma; reasons.push('Negative karma (+15)'); }
  // ... more heuristics
  const band: ScoredItem['band'] =
    score >= 60 ? 'CRITICAL' : score >= 40 ? 'HIGH' : score >= 20 ? 'ROUTINE' : 'LIKELY_OK';
  return { id: item.id, score, band, explanations: reasons };
}

// Wiki-based rules cache (5-min Redis TTL)
async function getRules(wikiPage: string): Promise<Rule[]> {
  const cacheKey = `rules:${wikiPage}`;
  let rules = await redis.get(cacheKey);
  if (!rules) {
    rules = await reddit.getWikiPage(wikiPage);  // Direct API fetch
    await redis.set(cacheKey, rules, { expiration: addMinutes(new Date(), 5) });
  }
  return JSON.parse(rules);
}
```
Pattern: heuristic-first (free), LLM fallback (expensive). Each scored item includes an explainability panel showing WHY it was prioritized. No black-box scoring. ~2500 lines total across src/. (Source: `nag-gude/triageguard`)

**Multi-Mod Locking with Redis Heartbeats (Vigil):**
Single-file Blocks app (~2700 lines in `Vigil.tsx`) with 8 Redis key namespaces and lazy-expiration locking:
```typescript
// ⚠️ Blocks-era code (@devvit/public-api 0.12.24). Needs migration to Devvit Web.
// Core pattern: Redis wrappers with lazy expiration — no background heartbeat needed.
// Instead of TTL refresh loops, the lock uses lazy expiration on every access.

const NAMESPACES = {
  queue:  (id: string) => `v:queue:${id}`,
  lock:   (id: string) => `v:lock:${id}`,    // Mod review lock (lazy-expire)
  report: (id: string) => `v:report:${id}`,   // Report metadata cache
  stats:  ()           => `v:stats`,           // Aggregated mod stats
  exempt: (user: string) => `v:exempt:${user}`, // Exempt users
  note:   (id: string) => `v:note:${id}`,      // Mod notes per item
  vote:   (id: string) => `v:vote:${id}`,      // Mod vote aggregation
  meta:   (key: string) => `v:meta:${key}`,    // App metadata
};

// Lazy-expiration lock pattern (no heartbeat needed)
async function tryLock(itemId: string, modId: string, ttl = 60): Promise<boolean> {
  const key = NAMESPACES.lock(itemId);
  const acquired = await redis.hSetNX(key, 'mod', modId);
  if (acquired) {
    await redis.hSet(key, 'ts', Date.now());
    await redis.expire(key, ttl);
    return true;
  }
  // Check if lock expired lazily — re-check before declaring dead
  const owner = await redis.hGet(key, 'mod');
  const ttlRemaining = await redis.ttl(key);
  if (ttlRemaining <= 0) {  // Key exists but no TTL — stale lock, reclaim
    await redis.del(key);
    return tryLock(itemId, modId, ttl); // Retry
  }
  return false; // Owned by another mod
}

// Dry-run mode enabled by default — all actions logged, none executed
const dryRun = await redis.get('v:config:dryRun') !== 'false';
if (dryRun) { /* log action, skip real execution */ }
```
Key patterns: 8 namespaces with prefixed keys, lazy expiration instead of heartbeats (simpler, fewer Redis calls), dry-run first. (Source: `labishbardiya/Vigil`. Blocks-era — needs migration before June 30, 2026.)

**Tool/Plugin Registry with Hono Routing (SuperModds):**
Extensible module system using Hono routing with typed tool interfaces and three launch modes:
```typescript
// src/server/tools/registry.ts — actual Hono-based registry
import { Hono } from 'hono';

interface SuperTool {
  name: string;
  version: string;
  enabled: boolean;
  permissions: string[];      // Required permission chain
  handlers: {
    onPost?: (post: Post) => Promise<Action | null>;
    onComment?: (comment: Comment) => Promise<Action | null>;
    onReport?: (report: Report) => Promise<Action | null>;
    onMenu?: () => Promise<UiResponse>;  // Mod menu action
  };
  config?: Record<string, unknown>;  // Per-tool settings
}

// Three launch modes (from actual devvit.json):
type LaunchMode = 'dev' | 'test' | 'production';
// dev: local-only, no Reddit API calls
// test: dry-run on real data
// production: full execution

const app = new Hono();

// Auto-discovery: scan src/server/tools/*.ts, register all exports matching SuperTool
const registry = new Map<string, SuperTool>();

function registerTool(tool: SuperTool) {
  registry.set(tool.name, tool);
  // Auto-mount Hono routes for each tool
  app.post(`/tools/${tool.name}/execute`, async (c) => {
    if (!tool.enabled) return c.json({ error: 'Tool disabled' }, 403);
    return c.json(await tool.handlers.onMenu?.() ?? { showToast: 'No action' });
  });
}

// Permission chain: tool declares required perms → checked before any handler runs
async function checkPermissions(tool: SuperTool, user: User): Promise<boolean> {
  const userPerms = await reddit.getUserPermissions(user.name);
  return tool.permissions.every(p => userPerms.includes(p));
}
```
Also features rolling-window rate limiting (Redis sorted set, not fixed calendar bucket) and permission chain system with auto-assignment. Routing via Hono, not Express. (Source: `Isaac12x/SuperModds`)

**Incident Workflow Lifecycle (Incident Room):**
Structured state-machine incident response: Declare → Claim → Brief → Confirm → After-action:
```typescript
// src/server/incident.ts — actual state machine from source
type IncidentStatus = 'declared' | 'claimed' | 'briefing' | 'confirmed' | 'after-action';

interface Incident {
  id: string;
  status: IncidentStatus;
  evidence: Evidence[];
  timeline: TimelineEntry[];
  claimedBy?: string;
  aiBrief?: string;           // Generated by OpenAI-compatible API
  metrics?: AfterActionMetrics; // Persisted in custom post after resolution
}

// Valid transitions (enforced by state machine):
const TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  'declared':       ['claimed'],
  'claimed':        ['briefing', 'declared'],  // Can un-claim
  'briefing':       ['confirmed', 'declared'],  // Escalate back if needed
  'confirmed':      ['after-action'],
  'after-action':   [],  // Terminal state
};

function transition(incident: Incident, to: IncidentStatus): Incident {
  if (!TRANSITIONS[incident.status].includes(to)) {
    throw new Error(`Cannot transition from ${incident.status} to ${to}`);
  }
  incident.status = to;
  incident.timeline.push({ timestamp: Date.now(), event: `Status: ${to}` });
  return incident;
}

// Evidence scoring — exact weights from source:
const EVIDENCE_WEIGHTS = {
  reportVelocity: 35,   // 3+ reports in 5 minutes
  watchTermHit:   25,   // Body/text matches watch terms
  freshAccount:   20,   // Account < 24h
  domainScore:    15,   // Previously-flagged domains
  karmaAnomaly:    5,   // Unusual karma pattern
};
// Score ≥ 50 auto-promotes Claim → Briefing (skips manual claim)
```
AI briefing via OpenAI-compatible API. After-action metrics persist in the custom post post-resolution. Full test suite: Vitest (unit) + Playwright (integration for rule scoring). (Source: `veithly/incident-room`)

**Framework Layering: GameServer Abstract Class (devvit-hub, devvit-phaser):**
518-line `BasicGameServer` abstract class wrapping Devvit APIs into reusable server classes — think Express for Devvit games:
```typescript
// npm package: devvit-hub — 518 lines, single file abstract class
// Auto-wires Realtime pub/sub per post. Hooks for game lifecycle.

abstract class BasicGameServer {
  constructor(
    protected redis: Redis,
    protected realtime: Realtime,
    protected postId: string   // Scoped to one post
  ) {}

  // Lifecycle hooks — subclasses override these:
  abstract onPostCreated(): Promise<void>;
  abstract onPlayerJoined(playerId: string): Promise<void>;
  abstract onGameEnd(winnerId: string): Promise<GameResult>;

  // Auto pub-sub per post (channel auto-namespaced to this.postId)
  async broadcast(event: string, data: unknown): Promise<void> {
    await this.realtime.send(`game:${this.postId}`, { event, data });
  }

  // Player management with Redis sorted sets
  async getPlayers(): Promise<Player[]> {
    const members = await redis.zRange(`game:${this.postId}:players`, 0, -1);
    return members.map(m => JSON.parse(m));
  }

  // State persistence with versioning
  async getState<T>(): Promise<T | null> {
    const raw = await redis.get(`game:${this.postId}:state`);
    return raw ? JSON.parse(raw) : null;
  }
  async setState<T>(state: T): Promise<void> {
    await redis.set(`game:${this.postId}:state`, JSON.stringify(state));
  }
}

// Three-tier inheritance:
// BasicGameServer (518 lines) → PhaserGameSrv (Phaser-specific hooks) → DataManagerServer (DB layer)
// Also includes MCP server for testing the game logic externally
```
(Source: `fizx/devvit-hub`, `fizx/devvit-phaser`. Note: `devvit-hub` uses Blocks-era patterns — needs migration to Devvit Web.)

**Sandboxed JS Execution via QuickJS (over9000games):**
Devvit Web app (~10K lines) using QuickJS as a user-game sandbox in TWO environments (browser + server):
```typescript
// ⚠️ Verified by reading actual source code (36 files, ~10K lines)

// Client-side QuickJS (browser): async WASM loading
import { getQuickJS } from "quickjs-emscripten";
const QuickJS = await getQuickJS();
const vm = QuickJS.newContext();
// vm.evalCode(userGameCode) — sandboxed, no access to DOM/Devvit APIs

// Server-side QuickJS (headless screenshots): sync CJS variant
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import releaseVariant from "@jitl/quickjs-singlefile-cjs-release-sync";
const QuickJS = await newQuickJSWASMModuleFromVariant(releaseVariant);
// Embeds WASM in the JS file — critical for Devvit's server env

// Shared executor (src/shared/game-runner-common.js):
// wraps game code with try-catch so runtime errors don't crash QuickJS
function wrapGameCode(gameCode: string): string {
  return `
${gameCode}
function doUpdate(deltaTime, input) {
  try {
    return update(deltaTime, input);
  } catch (error) {
    return { sprites: [], score: 0, gameOver: true,
      error: { message: error.message, stack: error.stack } };
  }
}`;
}
```
Key patterns: NES-style console rendering (sprites/tiles/scroll returned as state objects, not mutated), dual-canvas sprite architecture, 8-slot audio system with ADSR envelopes, async job queue for AI game generation (OpenAI Responses API + client polling every 3s), ESM loader hook testbed that mocks `@devvit/web/server` and `@devvit/web/client` for local development. No test files exist — relies on the custom testbed instead. (Source: `Strawberry-Computer/over9000games`. ~10K lines, Devvit Web, Vitest declared but zero tests.)

**Comment-as-Command Multiplayer (skill-seeker):**
Blocks-era multiplayer quiz game (~933 lines across 13 files) where players join teams by posting comments — NO trigger used, uses polling instead:
```typescript
// ⚠️ Blocks-era app (@devvit/public-api 0.11.9). NOT Devvit Web.
// ⚠️ Verified by reading actual source code (13 source files, 933 lines)

// Pages: Welcome → Team → Challenge → Victory/Defeat → Leaderboard
// State sync: single Realtime channel broadcasting full GameState

// 🔑 Key pattern: Comment-based team assembly via POLLING (not triggers)
// PageTeam.tsx polls every 5 seconds:
const interval = useInterval(async () => {
  if (!monitoring) return;
  const comments = await reddit.getComments({ postId });
  for await (const comment of comments) {
    const match = comment.body.toLowerCase().match(/!join (\w+)/);
    if (match) {
      const profession = match[1];
      // Assign player to role in teamMembers map
      // Broadcast updated state via realtime channel
    }
  }
}, 5000);  // Polls every 5 seconds — no deduplication!

// Full-state broadcast pattern (main.tsx):
function updateGameState(partial: Partial<GameState>) {
  const newState = { ...gameState, ...partial };
  context.realtime.send('game_state_sync', newState);  // Broadcast full state
  setGameState(newState);
}

// Role-gated answering: only the assigned player can answer questions
const isUserAllowed = currentUser?.toLowerCase() === assignedPlayer?.toLowerCase();
```

Key insights: Uses `useInterval` polling + Realtime channel for multiplayer — NOT triggers. No `Devvit.addTrigger`, no menu items, no schedulers. Redis is leaderboard-only (`zIncrBy`/`zRange`). Known issue: typo in UI says `/join` but code parses `!join`. No comment deduplication — same comments re-processed every 5s. (Source: `vero-code/skill-seeker`. Blocks-era, must migrate before June 30, 2026.)

**Devvit Env Var Limitation (devvit-ocrdocs):**
Critical documented finding confirmed by actual 310-line analysis document: `process.env` is NOT available in Devvit runtime. API keys must use Devvit settings (app-scoped secrets):
```typescript
// ❌ DOES NOT WORK in Devvit — process.env is undefined (confirmed in 310-line doc)
const apiKey = process.env.OPENAI_API_KEY;     // undefined

// ❌ dotenv, .env files — also don't work
require('dotenv').config();  // No filesystem access

// ✅ WORKS — use app-scoped settings defined in devvit.json
const apiKey = await context.settings.get<string>('openaiKey');

// ✅ Workaround for SDKs that demand env vars: pass via constructor
const s3 = new S3Client({
  region: await context.settings.get('awsRegion'),
  credentials: {
    accessKeyId: await context.settings.get('awsKeyId'),
    secretAccessKey: await context.settings.get('awsSecret'),
  },
});
// Note: Some SDKs (AWS SDK v3) accept explicit config. Others that
// call process.env internally will NOT work — those SDKs are incompatible.
```
This means: NO `dotenv`, NO `.env` files, NO `process.env`. Everything must go through Devvit's settings system. External service SDKs that internally call `process.env.X` at module load time are incompatible. Gemini API works because `@google/genai` accepts explicit API key parameter; AWS SDK v3 S3 works if you pass credentials via constructor. Detailed in `WHY_GEMINI_WORKS_BUT_AWS_DOESNT.md` (310 lines) by the app author. (Source: `fapulito/devvit-ocrdocs`)

**Multi-Peer Realtime via Minimal Devvit Surface (snoosings):**
Blocks-era networked drum machine/concert app (2,048 lines, 38 files) with only 174 lines (8.5%) of Devvit-specific code:
```typescript
// ⚠️ Blocks-era (@devvit/public-api 0.11.3). Verified by reading actual source code.
// Key insight: only 8.5% of code touches Devvit — rest is standard TS/Canvas/WebAudio.

// Realtime channel scoped to postId (each post = isolated concert room)
const chan = useChannel<PeerMessage>({
  name: ctx.postId ?? 't3_0',  // Post-scoped channel
  onMessage: msg => {
    // Filter self-messages by UUID to avoid echo
    if (msg.player.uuid !== uuid)
      ctx.ui.webView.postMessage<DevvitMessage>('web-view', { msg, type: 'Peer' });
  },
  onSubscribed() {
    ctx.ui.webView.postMessage<DevvitMessage>('web-view', { type: 'Connected' });
  },
  onUnsubscribed() {
    ctx.ui.webView.postMessage<DevvitMessage>('web-view', { type: 'Disconnected' });
  }
});

// Iframe ← → Devvit ← → Realtime ← → Other instances
// Message types: Connected, Disconnected, LocalRuntimeLoaded, PeerUpdate
// PeerUpdate throttled to 300ms, heartbeat every 9s, disconnect at 30s
// Remote player positions lerp-smoothed (ratio 0.1/frame) to avoid teleportation

// Architecture: <webview> iframe → postMessage ↔ Devvit (174 lines) ↔ Realtime ↔ peers
// Game engine (1,334 lines) is pure TS/Canvas/WebAudio — zero Devvit imports.
// Most logic is testable without mocking Devvit.
```
Key patterns: post-scoped Realtime channels (no Redis needed), throttled peer updates (300ms), 9s heartbeat, 30s disconnect timeout, melody as 8-char string with double-buffered recording, pentatonic synthesizer with logarithmic distance falloff. 5 test files, 11 test cases — pure function tests only. (Source: `reddit/devvit-snoosings`. Blocks-era, needs migration before June 30, 2026.)

**lit-html Webview + Custom Elements (fiddlesticks):**
Blocks-era golf game (2,198 lines across 43 files) using lit-html in a webview iframe with Custom Elements, NOT React:
```typescript
// ⚠️ Blocks-era (@devvit/public-api 0.11.5). Verified by reading actual source code.
// Uses lit-html 3.2.1 bundled via esbuild (no webpack/vite for webview build).

// Root custom element uses lit-html render() with state-based dispatch:
import { type TemplateResult, html, render } from 'lit-html';

class AppElement extends HTMLElement {
  #state: 'Loading' | 'Playing' | 'Unplayable' = 'Loading';

  #render(template: TemplateResult): void {
    render(template, this.shadowRoot!, { host: this });
  }

  render(): void {
    switch (this.#state) {
      case 'Loading':
        this.#render(html`<title-screen></title-screen>`);
        break;
      case 'Playing':
        this.#render(html`<play-screen ...></play-screen>`);
        break;
      case 'Unplayable':
        this.#render(html`<game-over-screen ...></game-over-screen>`);
        break;
    }
  }
}

// CSS via Constructable Stylesheets (NOT lit's css tag):
// Custom `css` template tag (because lit-html doesn't export its css helper)
function css(strs: TemplateStringsArray, ...vals: unknown[]): string {
  return strs.reduce((sum, str, i) => `${sum}${str}${vals[i] ?? ''}`, '');
}
static styles = new CSSStyleSheet();
static { styles.replace(css`.game { display: flex; }`); }
// Applied via adoptedStyleSheets on shadowRoot

// Webview <-> Devvit message protocol (typed discriminated unions):
type DevvitMessage = { type: 'Init'; debug: boolean; p1: Profile; seed: number; scoreboard: Scoreboard; };
type WebViewMessage = { type: 'GameOver'; score: number } | { type: 'Loaded' } | { type: 'NewGame' };

// Offline dev mode: when port===1234, mock Init message with random delay
// (game runs entirely in browser during development — no Devvit upload needed)
```
Key patterns: esbuild-only build (no webpack/vite), shadow DOM isolation with `adoptedStyleSheets`, `useState2` overloaded wrapper (async-safe), branded types for Reddit IDs (`t2_${string}`, `t3_${string}`), seeded Park-Miller PRNG for deterministic game state, SAT collision detection (Separating Axis Theorem), synthesized Web Audio (no prerecorded files), `composed: true` CustomEvent bubbles through shadow DOM. Redis layer: 378 lines with 12 key namespaces (player, post, match, leaderboard, etc.), composite keys `t3_t2`, no transactions yet. Scheduler for recurring match creation. (Source: `reddit/devvit-fiddlesticks`. Blocks-era, needs migration before June 30, 2026.)

### [context-mod-devvit](https://github.com/StephenSook/context-mod-devvit) — Rule-Engine Moderation Bot
```typescript
// 1. Hono routing — modular route files mounted on Hono app (src/index.ts)
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { api } from './routes/api';
import { triggers } from './routes/triggers';
import { scheduler } from './routes/scheduler';

const app = new Hono();
const internal = new Hono();
internal.route('/triggers', triggers);
internal.route('/cron', scheduler);
app.route('/api', api);
app.route('/internal', internal);
serve({ fetch: app.fetch, createServer, port: getServerPort() });

// 2. 3-tier idempotency — prevents double-fire on Devvit's at-least-once delivery
// Tier 1: firstSeen — 24h NX guard per thingId (fail-CLOSED on Redis error)
const result = await redis.set(`cm:proc:${thingId}`, '1', { nx: true, expiration: ... });
if (result !== 'OK') return; // already processed

// Tier 2: reserveAction — 5min NX lock + crypto.randomUUID() token
const token = `${Date.now()}-${crypto.randomUUID()}`;
const reserved = await redis.set(`cm:action:pending:${hash}`, token, { nx: true, expiration: ... });
// Check done marker inside lock window
const done = await redis.get(`cm:action:done:${hash}`);
if (done) { /* release pending, skip */ }

// Tier 3: commitAction — 7d done marker, compare-and-delete pending
await redis.set(`cm:action:done:${hash}`, '1', { expiration: 7 * 86400_000 });
const current = await redis.get(pendingKey);
if (current === token) await redis.del(pendingKey); // only delete if we own it

// 3. Circuit breaker — 3-state machine (CLOSED → OPEN → HALF_OPEN)
// 5 failures → OPEN for 60s → HALF_OPEN allows 1 probe → success → CLOSED
// Fails OPEN on Redis blip (better to let API calls through)
const cb = await checkCircuit(`openai:${sub}`);
if (cb.state === 'open') return 503; // retry in cb.retryInSec
// On success: await recordSuccess(bucket)
// On transient failure: await recordFailure(bucket) — only on 5xx/timeout, NOT 401

// 4. Rate limiting — fixed-window Redis counter (no Lua needed)
const rl = await checkRateLimit('explain', sub, 30, 3600); // 30/hr per sub
if (!rl.allowed) return 429;
// Per-user tighter cap: 10/hr on top of per-sub
const rlUser = await checkRateLimit('explain', `${sub}:${username}`, 10, 3600);

// 5. Mod-auth gating — defense-in-depth beyond Devvit's forUserType
// Custom posts are HTTP-reachable by ANY viewer, not just the mod who clicked
export async function requireModerator(): Promise<ModAuthResult> {
  const sub = (await reddit.getCurrentSubreddit()).name;
  const user = await reddit.getCurrentUser();
  const mods = await reddit.getModerators({ subredditName: sub }).all();
  const isMod = mods.some((m) => m.username === user.username);
  if (!isMod) return { ok: false, status: 403, error: 'not a moderator' };
  return { ok: true, sub, username: user.username };
}
// Classify transient errors → 503 (retry), programming errors → 500

// 6. Wiki config publish — immutable revisions + atomic pointer
// Mod edits wiki → cron parses JSON5 → validates with AJV → writes cfg:rev:{n} → bumps cfg:current_rev
// Every handleActivity reads the pointer ONCE at event start (read-once snapshot)
// Invalid config → pointer NOT bumped → sub keeps running last good config
```
Key patterns: Hono modular routing (not Express), 3-tier idempotency (firstSeen NX → reserveAction 5min lock → commitAction 7d done marker), circuit breaker (CLOSED→OPEN→HALF_OPEN, fails open on Redis errors), fixed-window rate limiting (per-sub + per-user), `requireModerator()` defense-in-depth for HTTP-reachable custom posts, wiki config publish with immutable revisions and atomic pointer (read-once snapshot, invalid config doesn't bump pointer). Devvit Web, JSON5 rules, 8 rule kinds, 8 action handlers, perceptual-blockhash image-repost, AI explain-event, Observatory dashboard. Hackathon 2026 entry. (Source: `StephenSook/context-mod-devvit`. Verified from source code.)

**Official Devvit App Patterns (reddit/devvit monorepo apps):**
The `reddit/devvit` monorepo contains reference apps under `packages/apps/`:
| App | Pattern |
|-----|---------|
| `server-push` | Scheduler + Realtime push — best ref for CRON→client push |
| `synced-progress-bar` | Multi-user synced progress via Realtime channels |
| `mini-place` | Collaborative pixel canvas (r/place-style) with Redis conflict resolution |
| `payments-example` | Full in-app purchase integration reference |
| `polls-plus` | Enhanced polls with realtime vote counts |
| `live-scores` | Live score updates via Realtime pub/sub |

## 5. Redis Patterns

### Basic Operations
```typescript
import { redis } from '@devvit/web/server';

// Simple key-value
await redis.set('my-key', 'value');
const val = await redis.get('my-key');
await redis.set('temp-key', 'value', { expiration: addDays(new Date(), 7) });

// Hashes
await redis.hSet('users', { alice: JSON.stringify(data), bob: JSON.stringify(data) });
const allUsers = await redis.hGetAll('users');
const user = await redis.hGet('users', 'alice');
await redis.hDel('users', ['alice']);

// Sorted sets (leaderboards)
await redis.zAdd('highscores', { member: 'alice', score: 100 });
const rank = await redis.zScore('highscores', 'alice');
const top10 = await redis.zRange('highscores', 0, 9, { by: 'rank' });
await redis.zRem('highscores', ['alice']);
const count = await redis.zCard('highscores');
```

### Community Redis Patterns

**1. TTL-Based Scheduler** (only-flairs)
Use Redis key TTL as "free" scheduling - no cron needed:
```typescript
await redis.set(postId, JSON.stringify(settings));
await redis.expire(postId, 86400); // Auto-deletes after 24h
// When key doesn't exist, feature is "off" - no polling needed
```

**2. Modlist as CSV String** (only-flairs, mod-mentions, admin-tattler)
```typescript
const mods = await subreddit.getModerators({ pageSize: 500 }).all();
await redis.set('mods', mods.map(m => m.username).join(','));
const isMod = (await redis.get('mods')).split(',').includes(username);
```
Invalidate on `AppInstall`, `AppUpgrade`, and specific `ModAction` events (`acceptmoderatorinvite`, `addmoderator`, `removemoderator`, `reordermoderators`).

**3. Hash-per-Field for Concurrent Writes** (user-scorer)
When two triggers (CommentSubmit + ModAction) fire simultaneously:
```typescript
// Each handler writes ONLY its own fields - no full-object overwrite
await redis.hSet(username, { comment_ids: JSON.stringify(ids), score: JSON.stringify(score) });
await redis.hSet(username, { removed_ids: JSON.stringify(ids), score: JSON.stringify(score) });
```

**4. Capped Arrays via trimArray** (user-scorer, mod-mentions)
```typescript
function trimArray(arr: string[], max: number): string[] {
  while (arr.length > max) arr.shift(); // FIFO - oldest first
  return arr;
}
```
user-scorer caps at 1000, mod-mentions at 50. Prevents unbounded Redis storage.

**5. ZSET as Timed Queue** (bot-bouncer)
```typescript
await redis.zAdd('cleanup-queue', { member: JSON.stringify(item), score: Date.now() + delay });
const due = await redis.zRange('cleanup-queue', 0, Date.now(), { by: 'score' });
await redis.zRemRangeByScore('cleanup-queue', 0, subDays(new Date(), 7).getTime());
```

**6. Sentinel Values** (user-scorer)
Use `-1` for "unscored" to distinguish from genuine `0.0`:
```typescript
const SCORE_PLACEHOLDER = -1;
await redis.zAdd('users', { member: username, score: SCORE_PLACEHOLDER });
// Query unscored users: redis.zRange('users', -1, -1, { by: 'score' })
```

**7. Sharded User Store** (bot-bouncer)
Shard by first character of username to avoid large hash limits:
```typescript
const ALL_PREFIXES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('');
function getStoreKey(username: string): string {
  return `UserStore~${username[0]}`; // 62 shards
}
```

**8. Chunked hSet for Large Hashes** (bot-bouncer)
```typescript
async function hSetChunked(redis, key, fieldValues, batchSize = 5000) {
  const chunkedEntries = chunk(Object.entries(fieldValues), batchSize);
  for (const chunk of chunkedEntries) {
    await redis.hSet(key, Object.fromEntries(chunk));
  }
}
```

**9. Compression with Pako** (bot-bouncer, toolbox-team/storage)
```typescript
import pako from 'pako';
function compress(value) {
  const compressed = `c:${Buffer.from(pako.deflate(value, { level: 9 })).toString('base64')}`;
  return compressed.length < value.length ? compressed : value;
}
```

**10. Global vs Local Redis** (bot-bouncer)
```typescript
await context.redis.hSet(key, fields);        // Per-subreddit (install-scoped)
await context.redis.global.hSet(key, fields); // Shared across ALL installs
```

**11. Eventually Consistent Writes**
Do NOT immediately verify writes. `zRem` may return 0 right after write but the member IS removed. Trust the write; subsequent reads will be correct.

**12. `hDel` Requires Array Format** (Meetit)
```typescript
// ❌ Silent failure - does NOT delete
await redis.hDel("myhash", fieldName);

// ✅ Correct - wraps field in array
await redis.hDel("myhash", [fieldName]);
```
Confirmed: `hDel` with single string silently succeeds but doesn't delete. Same pattern as `zRem`.

**13. Redis Transaction for Atomicity** (bot-bouncer)
```typescript
const txn = await redis.watch();
await txn.multi();
await txn.hSet('users', { [username]: JSON.stringify(data) });
await txn.zAdd('scores', { member: username, score: data.score });
await txn.exec();
```

**14. Distributed Lock with hSetNX** (Community Chats)
Prevent race conditions when multiple server instances try to create a shared resource:
```typescript
const lockAcquired = await redis.hSetNX('chat_thread_lock', postId, 'true');
if (lockAcquired === 1) {
  await redis.expire('chat_thread_lock', 15); // 15s TTL prevents deadlock
  await createParentComment();
}
```

**15. Message Sorted Sets for Real-Time Chat** (Community Chats)
Store chat messages as sorted sets with timestamp scores, capped for memory:
```typescript
await redis.zAdd(`chat:${postId}`, { member: JSON.stringify(msg), score: Date.now() });
const chatSize = await redis.zCard(`chat:${postId}`);
if (chatSize > 200) {
  await redis.zRemRangeByRank(`chat:${postId}`, 0, chatSize - 201); // Keep latest 200
}
const newMsgs = await redis.zRange(`chat:${postId}`, lastSync + 1, Infinity, { by: 'score' });
```

**16. Wiki-as-Data-Backup with Multi-Tier Fallback** (IRCC Processing)
Three-tier data loading: GitHub fetch → hardcoded sample → wiki page backup:
```typescript
// Tier 1: Primary data source (HTTP fetch from GitHub)
const data = await fetch(GITHUB_URL).then(r => r.json());

// Tier 2: If fetch fails, use hardcoded sample data
catch { data = SAMPLE_DATA; }

// Tier 3: Menu action lets mods manually seed from a wiki page
await reddit.getWikiPage(subredditName, 'data_backup');
await redis.set('data', page.content);
```
Also stores `data:previous` in Redis to detect changes between fetches.

**17. Jaccard Bigram Duplicate Detection** (Morddit)
Detect near-duplicate content without external APIs:
```typescript
function getBigrams(text) {
  const words = text.toLowerCase().split(/\s+/);
  return words.slice(0, -1).map((w, i) => w + ' ' + words[i + 1]);
}
function jaccardSimilarity(bigramsA, bigramsB) {
  const setA = new Set(bigramsA), setB = new Set(bigramsB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  return intersection.size / (setA.size + setB.size - intersection.size);
}
// >= 90% = EXACT duplicate, >= 50% = SIMILAR
```

**18. Redis Sorted Set Sliding Windows** (RaidShield)
O(log N) rate limiting without cron cleanup:
```typescript
async function recordAndCountVelocity(redis, key, memberId, windowMs) {
  const now = Date.now();
  await redis.zAdd(key, { score: now, member: `${memberId}:${now}` });
  await redis.zRemRangeByScore(key, 0, now - windowMs); // Prune expired
  return await redis.zCard(key); // Active count in window
}
```

**19. Homoglyph-Normalized Fingerprinting** (RaidShield)
Catch copy-paste spam even with Cyrillic lookalikes and zero-width characters:
```typescript
function fingerprintText(text) {
  let normalized = text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip zero-width chars
    .replace(/[аеорсх]/g, c => ({'а':'a','е':'e','о':'o','р':'p','с':'c','х':'x'}[c])) // Cyrillic
    .toLowerCase().replace(/[^a-z0-9 ]/g, '');
  let hash = 5381; // djb2
  for (let i = 0; i < normalized.length; i++) hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
```

**20. Redis WATCH/MULTI/EXEC CAS for Optimistic Concurrency** (AppealDesk)
Prevent silent overwrites with version-checked atomic mutations:
```typescript
async function mutate(redis, key, mutator) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const tx = await redis.watch(key);
    const current = JSON.parse(await redis.get(key) || '{}');
    const next = mutator(current);
    await tx.multi();
    await tx.set(key, JSON.stringify(next));
    const result = await tx.exec(); // null = conflict, retry
    if (result !== null) return next;
  }
  throw new Error('CAS conflict after 5 retries');
}
```

**21. Rolling Window Rate Limiting** (SuperModds)
Rate limit per action type using Redis sorted set sliding window — NOT fixed calendar bucket. Actual implementation uses action-scoped keys and returns remaining quota:
```typescript
const WINDOW_MS = 3600000; // 1 hour
const MAX_ACTIONS = 10;

async function checkRateLimit(key: string, userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${userId}`;
  // Clean expired entries (score < window start)
  await redis.zRemRangeByScore(windowKey, 0, now - WINDOW_MS);
  const count = await redis.zCard(windowKey);
  if (count >= MAX_ACTIONS) {
    // Get oldest entry to calculate reset time
    const oldest = await redis.zRange(windowKey, 0, 0);
    return { allowed: false, remaining: 0, resetAt: oldest.length > 0 ? oldest[0].score + WINDOW_MS : now + WINDOW_MS };
  }
  await redis.zAdd(windowKey, { score: now, member: `${now}:${crypto.randomUUID()}` });
  await redis.expire(windowKey, Math.ceil(WINDOW_MS / 1000)); // TTL for auto-cleanup
  return { allowed: true, remaining: MAX_ACTIONS - count - 1, resetAt: now + WINDOW_MS };
}
```
Key difference from fixed bucket: uses `zRemRangeByScore` to slide the window continuously — no traffic spikes at bucket boundaries. Returns `resetAt` so the client can show "try again in X minutes" instead of a generic rate-limited error. (Source: `Isaac12x/SuperModds`)

### Trigger Best Practices

**Duplicate trigger defense** (ModMail fires multiple times for same message):
```typescript
const handledKey = `messageHandled~${event.messageId}`;
if (await redis.exists(handledKey)) return;
await redis.set(handledKey, 'true', { expiration: addDays(new Date(), 28) });
```

**Self-identification** - skip app's own actions:
```typescript
if (author.name === 'my-app-name') return;
```

**Modlist invalidation on ModAction**:
```typescript
const modActions = ['acceptmoderatorinvite', 'addmoderator', 'removemoderator', 'reordermoderators'];
if (modActions.includes(action)) {
  await clearModerators(context);
  await refreshModerators(context);
}
```

**Pre-emptive content caching** (admin-tattler):
Cache post/comment bodies on PostSubmit/CommentSubmit with 30-day TTL. When admin removes content (shows "[ Removed by Reddit ]"), fall back to cache:
```typescript
// On submit:
await redis.set(post.id, JSON.stringify({ title, body, url }));
await redis.expire(post.id, 30 * 24 * 60 * 60);

// On admin detection:
if (post.title === '[ Removed by Reddit ]') {
  const cached = JSON.parse(await redis.get(post.id));
  title = cached.title; // Use cached content instead
}
```

**Race condition handling** (user-scorer):
When ModAction fires before CommentSubmit has tracked the comment:
```typescript
let data = await getUserData(user.name);
if (!data || !data.comment_ids.includes(comment.id)) {
  if (moderator.name === 'AutoModerator' || moderator.name === 'reddit') {
    await scheduler.runJob({
      name: 'delayedModAction',
      runAt: addSeconds(new Date(), 5), // 5-second delay for CommentSubmit to finish
      data: { action, username: user.name, comment_id: comment.id },
    });
  }
  return;
}
```

**Grace period on install** (bot-bouncer):
A 7-day `IN_GRACE_PERIOD` key makes the system treat all users as "recently active" so existing flagged users get processed retroactively even without new content.

**Event body recovery for redacted authors** (bot-bouncer):
When Reddit hides author names (`[redacted]`), fetch the post/comment by ID to get the real `authorName`.

---

## 7. Scheduler Patterns

### Job Registration in devvit.json
```json
"scheduler": {
  "tasks": {
    "daily-cleanup": {
      "endpoint": "/internal/scheduler/daily-cleanup",
      "cron": "0 0 * * *"
    },
    "every-minute": {
      "endpoint": "/internal/scheduler/every-minute",
      "cron": "* * * * *"
    }
  }
}
```

### Run One-Off Jobs Programmatically
```typescript
import { scheduler } from '@devvit/web/server';

await scheduler.runJob({
  name: 'my-job',
  data: { userId: '123' },
  runAt: addMinutes(new Date(), 30), // Run 30 min from now
});
```

### Key Patterns

**1. Self-Chaining Jobs** (bot-bouncer)
Process N items, re-schedule self if more work remains:
```typescript
async function processBatch(event, context) {
  const items = await getNextBatch(); // Process N items
  if (items.length > 0) {
    await scheduler.runJob({
      name: 'processBatch',
      runAt: addSeconds(new Date(), 2), // Chain after 2s delay
      data: { cursor: nextCursor },
    });
  }
}
```

**2. Randomized Cron Minutes** (bot-bouncer)
Prevent thundering herd when thousands of subreddits all fire at once:
```typescript
const randomMinute = Math.floor(Math.random() * 60);
const cron = `${randomMinute} * * * *`;
```

**3. Job Integrity Self-Healing** (bot-bouncer)
Periodically verify expected jobs exist, recreate if missing:
```typescript
const allJobs = await scheduler.listJobs();
const missing = expectedJobs.filter(name => !allJobs.some(j => j.name === name));
if (missing.length > 0) {
  await Promise.all(allJobs.map(j => scheduler.cancelJob(j.id)));
  await recreateJobs(context); // Full reset
}
```

**4. Staggered Fan-Out** (bot-bouncer)
Avoid platform rate limits by staggering jobs:
```typescript
await Promise.all([
  scheduler.runJob({ name: 'job1', runAt: new Date() }),
  scheduler.runJob({ name: 'job2', runAt: addMinutes(new Date(), 1) }),
  scheduler.runJob({ name: 'job3', runAt: addMinutes(new Date(), 2) }),
]);
```

**5. First-Run Throttle Guard** (bot-bouncer)
```typescript
const recentlyRunKey = 'myJobRecentlyRun';
if (event.data?.firstRun && await redis.exists(recentlyRunKey)) return;
await redis.set(recentlyRunKey, 'true', { expiration: addSeconds(new Date(), 30) });
```

**6. Dual Scheduling: Cron + setInterval** (microlympics)
```typescript
// Cron: guaranteed execution
// setInterval: safety net that catches missed cron executions
class DailyPostScheduler {
  start() {
    this.checkAndCreatePosts(); // Run immediately
    setInterval(() => this.checkAndCreatePosts(), 60000); // Every 60s as safety net
  }
  async checkAndCreatePosts() {
    const today = todayLocalISO();
    if (this.lastCheckDate === today) return; // Idempotency gate
    const exists = await redis.get(`daily:${today}:postId`);
    if (exists) { this.lastCheckDate = today; return; }
    await createPost();
  }
}
```

**7. Install/Upgrade - Cancel All, Recreate** (bot-bouncer)
```typescript
async function onInstallOrUpgrade(_, context) {
  const currentJobs = await scheduler.listJobs();
  await Promise.all(currentJobs.map(j => scheduler.cancelJob(j.id)));
  await createAllJobs(context); // Recreate from scratch
}
```

**8. ZSET-Based Cleanup Queues** (bot-bouncer)
Instead of cron-scanning all data, add items to a sorted set with cleanup date as score. Cleanup job processes only items with `score < Date.now()`.

**9. Delayed Action Queue** (automodmail)
```typescript
await scheduler.runJob({
  name: 'actOnMessageAfterDelay',
  data: { action: JSON.stringify(action) },
  runAt: addSeconds(new Date(), sendAfterDelay),
});
```

**10. CRON vs One-Shot: Critical Discovery** (Meetit)
One-shot `scheduler.runJob()` NEVER fires in Devvit Web inline context. Jobs are scheduled (logs confirm) but never execute. ONLY CRON-based scheduling works:
```json
// ✅ WORKS - fires reliably
"scheduler": { "tasks": { "check-events": { "endpoint": "/internal/scheduler/check-events", "cron": "*/5 * * * *" } } }
```
```typescript
// ❌ DOES NOT WORK in Devvit Web inline - schedules but never fires
await scheduler.runJob({ name: 'reminder', runAt: futureDate, data: { eventId } });
```
Confirmed: CRON jobs fire every 5 minutes reliably. Use CRON for ALL background tasks.

**11. Hybrid Architecture: Beautiful UI + CRON Backend** (Meetit)
```
Devvit Web (HTML/CSS/JS)  ->  User-facing UI (events, RSVPs, forms, mod dashboard)
CRON scheduler (*/5)       ->  Background tasks (scan events, create reminder posts, send DMs)
Redis                      ->  Shared data layer between both contexts
```
This bridges Devvit Web's rich UI with backend capabilities. The CRON job runs server-side, independent of the webview iframe.

**12. CRON Context Differences** (Meetit)
| Capability | CRON Context | Webview Context |
|-----------|-------------|-----------------|
| `redis.*` all operations | Available | Available |
| `reddit.submitCustomPost()` | Available | Available |
| `context.postId` | NOT available (no user post) | Available |
| `reddit.submitComment()` | Not available | Not available |
| `reddit.sendPrivateMessage()` | Untested (may work) | Not available |

**13. CRON Best Practices** (Meetit)
- Use Redis TTL flags (`reminded:${eventId}` with 24h TTL) to prevent duplicate processing on next cron tick
- Wrap `submitCustomPost` and `sendPrivateMessage` in individual try-catch so one failure doesn't stop the loop
- Log every event with `[CRON]` prefix for easy log filtering
- Return `{ status: "ok" }` with HTTP 200

---

## 8. Settings & Configuration Patterns


### Define in devvit.json
```json
"settings": {
  "subreddit": {
    "webhookURL": { "type": "string", "label": "Webhook URL", "onValidate": "validateWebhookURL" },
    "sendModmail": { "type": "boolean", "label": "Send Modmail", "defaultValue": true },
    "threshold": { "type": "number", "label": "Threshold", "defaultValue": 0.5 },
    "ignoreList": { "type": "string", "label": "Ignore List (comma-separated)" }
  }
}
```

### Read Settings
```typescript
import { settings } from '@devvit/web/server';
// ALWAYS pass key - settings.get() without args returns undefined
const webhook = await settings.get<string>('webhookURL');
const ignoreStr = await settings.get<string>('ignoreList');
const list = (ignoreStr || '').split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
```

### Patterns

**Runtime Guard Clause** (admin-tattler, mod-mentions):
```typescript
async function getValidatedSettings() {
  const s = await settings.getAll();
  if (!s.sendModmail && !s.webhookURL) {
    throw new Error('At least one notification channel must be enabled');
  }
  return s;
}
```

**Custom Validator on Save**:
```typescript
function validateWebhookURL(event) {
  if (event.value && !(
    event.value.startsWith('https://hooks.slack.com/') ||
    event.value.startsWith('https://discord.com/api/webhooks/')
  )) return 'Must be valid Slack or Discord webhook URL';
}
```

**Settings-Change Recalibration** (user-scorer):
```typescript
if (settings.numComments !== data.numComments_for_score) {
  data.score = calculateScore(data, settings.numComments);
  // numComments_for_score acts as cache-bust flag
}
```

**Enum-Based Setting Names** (avoids typos):
```typescript
enum AppSetting { WebhookURL = 'webhookURL', Threshold = 'threshold' }
const webhook = await settings.get<string>(AppSetting.WebhookURL);
```

**Wiki-Backed JSON Config** (bot-bouncer, automodmail):
For complex configs beyond settings fields, store as JSON on a wiki page:
```typescript
const page = await reddit.getWikiPage('my-sub', 'app-config');
const config = JSON.parse(page.content); // Validated with AJV JSON Schema
await redis.set('config-cache', page.content, { expiration: addMinutes(new Date(), 15) });
```

**Feature Flags** (bot-bouncer):
```typescript
const FeatureFlags = { enableNewFeature: false };
// Used to conditionally add settings fields and schedule jobs
```

**App-Scoped Secrets**:
```json
{ "type": "string", "name": "openaiKey", "scope": "app", "isSecret": true }
```

---

## 9. Notifications: Webhooks, Modmail, PMs

### URL-as-Platform-Discriminator Pattern
```typescript
if (webhookUrl.startsWith('https://hooks.slack.com/')) {
  payload = { text: `*Subject:* <${link}|${subject}>` }; // Slack MRKDWN
} else if (webhookUrl.match(/discord(?:app)?.com\/api\/webhooks/)) {
  payload = {
    embeds: [{
      title: subject,
      color: 16729344, // OrangeRed
      fields: [{ name: 'Action', value: `\`${action}\`` }],
      description: body.substring(0, 4096), // Discord limit
    }],
  };
}
await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

### Platform Limits
| Platform | Limit | Format |
|----------|-------|--------|
| Slack | No hard limit on text | `<url|label>` links, `*bold*` |
| Discord | Embed description max 4096 chars | `[label](url)` links, `**bold**` |
| Modmail | Body ~9000 chars | Reddit markdown |

### Modmail
```typescript
await reddit.modMail.createModInboxConversation({
  subredditId: subreddit.id,
  subject: 'Alert Subject',
  bodyMarkdown: `**Action detected** in r/${subredditName}`,
});
```

### PM Error Handling (bot-reply-msg)
```typescript
try {
  await reddit.sendPrivateMessage({ to: username, subject, text });
} catch (error) {
  if (error === 'NOT_WHITELISTED_BY_USER_MESSAGE') {
    console.log(`User ${username} has messaging disabled`);
  }
}
```

### Per-Channel Isolation
All notification channels should be independent - one failure shouldn't block others:
```typescript
await Promise.allSettled([
  sendModmail().catch(e => console.error('Modmail:', e)),
  sendSlack().catch(e => console.error('Slack:', e)),
  sendDiscord().catch(e => console.error('Discord:', e)),
]);
```

---

## 10. Devvit Blocks <-> WebView Bridge

### ❌ REMOVED (June 2026) — Blocks UI no longer exists

Blocks and `useWebView()` were **removed in v0.13.0** (May 26, 2026). Support ends on all Reddit clients **June 30, 2026**.

**Do NOT use `window.parent.postMessage` in new apps.** All communication is now HTTP-based via `fetch('/api/...')`.

### Archived Reference (for migrating old code):
The old pattern used `useWebView()` + `postMessage` bridge:
```typescript
// ❌ OLD BLOCKS PATTERN — DO NOT USE
const { mount, postMessage } = useWebView({
  url: 'index.html',
  onMessage: async (ev) => {
    switch (ev.type) {
      case 'save:score': await redisService.saveScore(ev.data.score); break;
      case 'request:stats': postMessage({ type: 'update:stats', data: stats }); break;
    }
  },
});

window.parent.postMessage({ type: 'save:score', data: { score: 100 } }, '*');
```


### New Pattern (Devvit Web - HTTP):
```typescript
// Client: standard fetch
const response = await fetch('/api/save-score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ score: 100 }),
});

// Server: Express route
router.post('/api/save-score', async (req, res) => {
  const { score } = req.body;
  await redis.zAdd('highscores', { member: context.username, score });
  res.json({ success: true });
});
```

### Discriminated Union Message Protocol (devvit-as-backend):
```typescript
// shared/types/message.ts
export type WebViewMessage =
  | { type: 'webViewReady' }
  | { type: 'fetchPostData' }
  | { type: 'setUserScore'; data: { score: number } };

export type DevvitMessage =
  | { type: 'initialData'; data: { userId: string; postId: string } }
  | { type: 'fetchPostDataResponse'; data: { postData: PostData } };
```

### Standalone Dev Detection:
```typescript
const isEmbedded = window !== window.top;
if (!isEmbedded) {
  playerStats = { highscore: 0, attempts: 0 }; // Mock data for local Vite dev
} else {
  await fetch('/api/player-stats'); // Real data when embedded
}
```

## 11. Game Integration

### Phaser Setup
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { devvit } from '@devvit/start/vite';
export default defineConfig({
  plugins: [devvit({ client: { build: { chunkSizeWarningLimit: 2000 } } })],
  // For manual chunking: rollupOptions.output.manualChunks = { phaser: ['phaser'] }
});
```

Scene flow: Boot -> Preloader -> MainMenu -> Game -> GameOver

Key Phaser config: `Phaser.Scale.RESIZE` + `CENTER_BOTH` for responsive canvas.
Use `this.scale.on('resize', ...)` for layout recalculation.

### Three.js Setup
- `THREE.WebGLRenderer({ antialias: true, canvas: ... })` with `setPixelRatio(window.devicePixelRatio ?? 1)`
- Responsive resize handler updates camera and renderer
- Interaction via `raycaster.setFromCamera(mouse, camera)` + `intersectObject(sphere)`

Fullscreen meta tags (required for mobile):
```html
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0,
  width=device-width, height=device-height, user-scalable=0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Unity Export
- Export twice: GZip (.data.unityweb + .wasm.unityweb) and uncompressed (.framework.js)
- Replace 3 files in `src/client/public/Build/`; max 100 MB, 30s upload timeout
- `DevvitBridge.cs` uses UnityWebRequest for `/api/` communication

### Godot (CSP-Compliant)
- Compile Godot with 2D-only modules (custom.py)
- Use CSP-compliant HTML shell (no inline scripts/styles)
- Docker-based pipeline for reproducible builds

### Game State Persistence
```typescript
// Leaderboard (sorted set)
await redis.zAdd('${postId}:highscores', { member: userId, score });
// Player stats (hash)
await redis.hIncrBy('${postId}:attempts', userId, 1);
// Per-player per-post state
await redis.set('${context.postId}:${context.username}', JSON.stringify(gameState));
```

---

## 12. Error Handling and Platform Quirks

### Error Handling Patterns

**Fire-and-log** (non-critical):
```typescript
await reddit.report(object, { reason: 'Spam' })
  .then(() => console.log('Reported'))
  .catch((e) => console.error('Error:', e));
```

**Promise.allSettled** for independent tasks:
```typescript
await Promise.allSettled([sendModmail(), sendWebhook(), addModNote()]);
```

**Defensive try/catch** for platform APIs:
```typescript
try { user = await reddit.getUserByUsername(username); }
catch (err) { console.error('Error:', err); }
// user stays undefined - caller handles gracefully
```

**Early guard clause:**
```typescript
if (context.subredditName !== EXPECTED) throw new Error('Wrong subreddit');
```

### Platform Quirks & Workarounds

| Quirk | Workaround |
|-------|-----------|
| Redis writes eventually consistent | Don't immediately verify; trust the write |
| `getModerators()` returns object with `.children` | Access `.children` property |
| `settings.get()` without args returns undefined | Always pass key: `settings.get("key")` |
| `zScore` returns `undefined` not `null` | Use `!= null` (loose equality) |
| Inline `onclick` blocked by CSP | Use `addEventListener` |
| `scheduler.on()` doesn't exist in Devvit Web | Use endpoint-based scheduler in devvit.json |
| `modMail.createConversation()` unavailable | Save to Redis, display in mod dashboard |
| `sendPrivateMessage` may throw user-block | Catch `"NOT_WHITELISTED_BY_USER_MESSAGE"` |
| Content shows `[ Removed by Reddit ]` | Pre-emptively cache on submit, fall back to cache |
| Dual CommentSubmit + ModAction race | 5-second delayed retry via scheduler |
| ModMail triggers fire multiple times | Redis key dedup per message ID (28-day TTL) |
| Modlist may be empty after eviction | Defensive check + inline re-fetch |
| `[redacted]` author names | Fetch post/comment by ID for real author |
| Deleted users return 404 | Catch and treat as suspended/deleted |
| Mobile inline webview can't scroll | Break forms into steps, add scroll buttons |
| External images blocked in webview | Bundled assets only, or upload via media endpoint |
| esbuild EFTYPE error on Windows | Match esbuild version in deps + devDeps; clean install |
| `hDel(field)` silently fails | Must wrap in array: `hDel(key, [field])` |
| One-shot `scheduler.runJob()` never fires in inline | Use CRON scheduler (`devvit.json` tasks) for ALL background work |
| `confirm()` blocked by CSP in webview | Use in-app UI confirmation, never browser dialogs |
| `context.subredditName` vs `context.subreddit` | Use `context.subredditName \|\| context.subreddit` for safety |
| `context.postId` is raw ID (no `t3_` prefix) | Check: `postId.startsWith("t3_") ? postId : "t3_" + postId` |
| `reddit.submitComment()` fails in inline webview | Not available; use `reddit.submitCustomPost()` instead |
| `process.env` is undefined in Devvit runtime | Use app-scoped settings for API keys: `context.settings.get('myKey')` |
| No `dotenv`, no `.env` files, no env var SDK config | Settings-based pattern for all secrets — AWS/Stripe SDKs that require env vars won't work directly |
| Tab rapid-click causes API flood | Add debounce flag: `if (loading) return; loading = true;` |
| `sendPrivateMessage({ to: "/r/subreddit" })` (modmail) | ✅ Works from CRON context (tested 2026-05-27) |
| `sendPrivateMessage({ to: "username" })` (individual DM) | ❌ Fails with ERR_INVALID_ARG_TYPE — not available in Devvit Web |
| `select` settings return `string[]` not `string` | Unwrap: `Array.isArray(v) ? v[0] : v` — Devvit SelectField is BaseField<string[]> |
| CRON context has no `context.postId` | Triggers from server, not user post — different execution context than webview |
| `runAs: 'USER'` permissions | Requires explicit approval in devvit.json — supported: submitPost, submitCustomPost, submitComment |
| Redis Transactions (`watch`/`multi`/`exec`) | Available in Devvit Web — max 20 concurrent, 5s timeout |
| `requestExpandedMode()` | Incompatible with overlay DOM architectures — use scroll buttons or multi-step forms instead |
| Dead code calling broken APIs | Remove or convert to no-op with log — `submitComment()`, `sendPrivateMessage(username)` are broken |
| Usernames stored with `u/` prefix | Always normalize before re-prefixing — `stripUsernamePrefix()` helper prevents `u/u/username` |

### Self-Healing
```typescript
// Modlist self-healing
let mods = await redis.get('mods');
if (!mods) { await refreshModerators(context); mods = await redis.get('mods'); }

// Job integrity self-healing
const missing = expectedJobs.filter(n => !allJobs.some(j => j.name === n));
if (missing.length > 0) await recreateAllJobs(context);
```

---

### Battle-Tested Production Patterns

#### Logging Requirements (Devvit Web)

**`console.log` does NOT surface in Devvit Web inline webview.** The only way to debug production issues is via:
- **Server logs:** `devvit-cli logs r/your_subreddit` (terminal only)
- **Client logs:** Custom on-screen debug panel with copy-to-clipboard

**Rule:** Every new feature MUST add logging:

1. **Client-side** — Use a `log()` function (not `console.log`):
```typescript
function log(msg: string) {
  const panel = document.getElementById('debug-entries');
  if (panel) panel.innerHTML += `<div class="log-entry">${msg}</div>`;
  // Also store in localStorage for persistence
}
log("featureName action=id state=detail");
```

2. **Server-side** — Use `console.log()` with structured prefixes:
```typescript
console.log(`[FEATURE] action detail | key=value`);
```

3. **Critical paths to log:** Entry/exit of handlers, state mutations, error paths, external API calls.

#### CRON Scheduler: The Only Reliable Background Pattern

**One-shot `scheduler.runJob()` never fires in Devvit Web inline context** (empirically confirmed). Only CRON-based scheduler works.

**Hybrid architecture pattern:**
```
Devvit Web (HTML/CSS/JS) → User-facing UI (forms, overlays, navigation)
CRON scheduler (*/5 min) → Background tasks (scans, reminders, alerts)
Redis → Shared data layer between both contexts
```

**CRON context differences:**
- ✅ Has: `redis`, `reddit.submitCustomPost()`, `reddit.sendPrivateMessage({to: "/r/subreddit"})`
- ❌ Missing: `context.postId` (triggers from server, not user post)
- ❌ Broken: `reddit.submitComment()`, `sendPrivateMessage({to: "username"})`

**CRON best practices:**
- Use Redis TTL flags to prevent duplicate processing on next tick
- Wrap each API call in individual try-catch (one failure doesn't stop the loop)
- Log every event with `[CRON]` prefix for easy filtering
- Return `{ status: "ok" }` with HTTP 200

#### Security Patterns (Production-Tested)

**PII cleanup on leave/delete:** When a user leaves an event or a mod deletes it, explicitly clean up email/phone from Redis hashes. Redis doesn't auto-expire or cascade-delete.

**Validate entity existence before writing:** Never assume the client sends valid IDs. Check the entity exists before performing operations on it.

**Return 404 for missing entities:** Don't silently succeed when a resource is not found. Return explicit error with status 404.

**Never use empty string as Redis member key:** If `context.username` is empty, reject with 401. Empty keys cause data corruption when multiple unauthenticated requests collapse into the same key.

**Username auth gating:** Always check `context.username` is non-empty before writing to Redis:
```typescript
const username = context.username;
if (!username) return { error: "Authentication required", status: 401 };
```

**CSV formula injection prevention:** When exporting data to CSV, prefix fields starting with `=`, `+`, `-`, `@`, `\t`, `\r` with a single quote to prevent Excel formula execution:
```typescript
function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  let v = String(value);
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return `"${v.replace(/"/g, '""')}"`;
}
```

#### iOS Safari Gotchas

**`height:100%` inside flex containers** — iOS Safari resolves as `auto` instead of filling parent. Fix: use `position: absolute; top:0; left:0; right:0; bottom:0` to lock elements to parent bounds.

**Blank webview after `navigateTo()` + Back** — On iOS, calling `navigateTo(url)` then tapping Back often shows a blank white screen. Fix: Add a `visibilitychange` listener that re-renders the active surface when the page becomes visible again:
```typescript
document.addEventListener("visibilitychange", function() {
  if (document.visibilityState !== "visible") return;
  // Soft-render: re-fetch data and re-render current view
  if (modOverlay active) loadModTab(modTab);
  else if (myStuff active) loadMySubmissions();
  else loadHome();
});
```
Key: Use soft-render (re-fetch + re-render current card), not hard re-init (which wipes open overlays and form state).

**Flex child min-width trap** — Flex children default to `min-width: auto` which prevents shrinking. Always set `min-width: 0` on flex children that need to truncate or scroll horizontally.

#### Event Delegation Pattern (Don't Mix with Direct Listeners)

Use a single `data-action` attribute + one `document.body` listener. Never add direct `addEventListener` calls on the same elements — mixing causes silent double-fires.

```html
<button data-action="approve" data-id="event_123">Approve</button>
```
```typescript
document.body.addEventListener("click", function(e) {
  const target = e.target as HTMLElement;
  const action = target.getAttribute("data-action");
  const id = target.getAttribute("data-id");
  if (!action) return;
  switch(action) {
    case "approve": approveEvent(id); break;
    case "delete": deleteEvent(id); break;
  }
});
```

**Per-instance pagination lock:** For rapid-click pagination (Prev/Next), use item-ID-keyed locks:
```typescript
var locks: Record<string, boolean> = {};
function isLocked(key: string) { return !!locks[key]; }
function lock(key: string) { locks[key] = true; }
function unlock(key: string) { delete locks[key]; }

// In handler:
case "next":
  var lockKey = "nav-" + id;
  if (isLocked(lockKey)) return;
  lock(lockKey);
  // ... increment, re-render ...
  setTimeout(() => unlock(lockKey), 300);
```

#### Code Safety Patterns

**Don't delete server code near helper functions without checking dependencies.** Deleting "dead" functions that share helpers with live code can crash the app. Always search for references before touching any function.

**Safe approach: one edit, one build, one test.** Apply ONE change → build → verify. Never batch-delete blocks that span multiple function boundaries.

**Dead code calling broken APIs is a trap.** Either remove it or make it a no-op with a clear log message. Never leave it looking functional — it misleads future developers.

**`requestExpandedMode()` is incompatible with overlay DOM architectures.** Games and chat apps use it because they render one canvas/view. Apps with 6+ overlays (details, forms, mod dashboard) will break because DOM elements are destroyed when inline HTML is replaced.

---

## 13. Client-Side UI Patterns (Devvit Web)

### Tab Debouncing (Meetit)
Prevent API flood from rapid clicks in inline webview:
```typescript
var tabLoading = false;
function switchTab(tab: string) {
  if (tabLoading || tab === currentTab) return;
  tabLoading = true;
  await fetch('/api/tab-data?tab=' + tab);
  tabLoading = false;
}
```

### bindButtons() After Every DOM Mutation
After any `innerHTML = ...` call that creates buttons, listeners must be re-bound:
```typescript
function renderHTML(html) {
  container.innerHTML = html;
  bindButtons(); // Re-attach event listeners
}
function bindButtons() {
  document.querySelectorAll('.btn-submit').forEach(btn => {
    btn.addEventListener('click', handleSubmit);
  });
}
```

### data-* Attributes for Parameters
Pass parameters through markup without inline onclick:
```html
<button data-id="event_123" data-action="rsvp">RSVP</button>
```
```typescript
btn.addEventListener('click', function() {
  const eventId = this.getAttribute('data-id');
  const action = this.getAttribute('data-action');
});
```

### Privacy Pattern: Split Views by Audience (Meetit)
```typescript
// Public view: username only
if (!isMod) {
  attendeesHTML = attendees.map(a => `u/${a.username}`).join(', ');
}
// Mod view: full contact info + CSV export
if (isMod) {
  attendeesHTML = buildTable(attendees); // Shows email, phone, joined time
}
```
Email/phone/contact data ONLY shown in Mod Dashboard. Public view shows only Reddit usernames.

### Hardcoded Fallback Data
Always include default content in HTML so UI renders instantly:
```html
<div id="content">
  <div class="event-card"><h3>Loading events...</h3></div>
</div>
```

### Real-Time Polling with Overlap Guard (Community Chats)
Polling every 3 seconds with a ref guard to prevent overlapping requests:
```typescript
const pollingRef = useRef(false);
const sync = useCallback(async () => {
  if (pollingRef.current) return; // Skip if previous poll still in-flight
  pollingRef.current = true;
  const res = await fetch(`/api/sync?lastSync=${lastSync}`);
  pollingRef.current = false;
  // Merge new messages, update state
}, []);

useEffect(() => {
  const interval = setInterval(sync, 3000);
  return () => clearInterval(interval);
}, []);
```

### Optimistic Updates (Community Chats)
Update UI immediately, roll back on error:
```typescript
const sendMessage = async (text: string) => {
  const optimistic = { id: `opt-${Date.now()}`, text, author: username };
  setMessages(prev => [...prev, optimistic]); // Show instantly
  try {
    const res = await fetch('/api/message', { method: 'POST', body: JSON.stringify({ text }) });
    const real = await res.json();
    setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m)); // Replace with real
  } catch {
    setMessages(prev => prev.filter(m => m.id !== optimistic.id)); // Roll back
  }
};
```

### Devvit Forms for Client-Side Interactions (Community Chats)
Use `showForm()` from `@devvit/web/client` instead of building custom HTML forms:
```typescript
import { showForm } from '@devvit/web/client';
const result = await showForm({
  title: 'Upload Image',
  fields: [{ name: 'myImage', type: 'image', label: 'Select Image', required: true }],
  acceptLabel: 'Send',
});
if (result.action === 'SUBMITTED') {
  await sendMessage(result.values.myImage as string);
}
```

---

## 14. MCP Server Usage

### Devvit MCP (`@devvit/mcp`)
```powershell
npx -y @devvit/mcp
```

### Available Tools
| Tool | Description | Parameters |
|------|-------------|-----------|
| `devvit_search` | Semantic search on indexed Devvit docs | `query`, `limit`, `exactMatch` |
| `devvit_logs` | Streams app logs via CLI | `subreddit`, `app` |

### How It Works
- Downloads pre-built SQLite embeddings DB from GitHub Releases on first use
- Resolves host project's Devvit version from `package.json`
- Semantic search against docs DB, returns formatted results with source URLs
- Logs tool spawns `npx devvit logs <subreddit>` as child process

### opencode MCP Config
```json
{ "mcpServers": { "devvit": { "command": "npx", "args": ["-y", "@devvit/mcp"] } } }
```

---

## 15. Stitch Design Integration

### Creating a Design System
1. Use `stitch_create_design_system` to set colors, fonts, roundness
2. Use `stitch_create_project` to create a project
3. Use `stitch_generate_screen_from_text` with prompts like:
   - "A mobile game dashboard with neon yellow header, dark background, card-based layout"
   - "A mod tool settings page with toggle switches and dropdown fields"
4. Use `stitch_apply_design_system` to apply design tokens to screens

### Design Tips for Devvit
- Neo-Brutalist works well: hard shadows, bold borders, high contrast
- Space Grotesk is a great Devvit font (available in Stitch)
- `ROUND_FOUR` or `ROUND_EIGHT` for modern feel, `ROUND_TWELVE` for pill shapes
- Dark mode (`COLOR_MODE_DARK`) is more Reddit-native
- Generate screens at mobile width first, then desktop

### devvit-kit (`@devvit/kit`) UI Components
```typescript
import { usePagination } from '@devvit/kit';
const { currentItems, toNextPage, toPrevPage, pagesCount } = usePagination(context, items, 10);

import { DevToolbar, devAction } from '@devvit/kit';
// Dev-only action buttons, visibility gated to specific usernames

import { Columns } from '@devvit/kit';
<Columns columnCount={2} gapX="16px" gapY="16px">{children}</Columns>
```

---

## 16. Testing and Debugging

### Logs
```powershell
npx devvit logs r/your_subreddit           # Stream live logs
npx devvit logs r/your_subreddit --since 1h # Last hour
```

### Testing Framework
All community repos use **Vitest**:
```typescript
import { describe, it, expect } from 'vitest';
describe('trimArray', () => {
  it('caps at max items', () => {
    expect(trimArray(['a','b','c','d','e'], 3)).toEqual(['c','d','e']); // FIFO
  });
});
```

### Test Strategy
- **Pure logic**: Test scoring, validation, formatting (no Devvit context needed)
- **Storage wrappers**: Mock `redis` and test CRUD
- **Service classes**: Test with injected mocks
- **UI components**: Use Play test framework for component tests

### Debugging Checklist
- [ ] Run `npx devvit logs r/subreddit` while reproducing
- [ ] Check devvit.json permissions match API calls
- [ ] Verify server builds to CJS (not ESM)
- [ ] Check Redis keys with console.log
- [ ] Test on both mobile and desktop
- [ ] Click "Update" on developer portal after upload
- [ ] Run `npx devvit whoami` to confirm logged in
- [ ] Verify Node.js >= 22.2.0
- [ ] **Blocks migration check:** Are you using `@devvit/web`? (Not `@devvit/public-api`)
- [ ] **JSON check:** Are you fetching `reddit.com/.json` without auth? (Blocked)
- [ ] **Logged Out check:** Does the app handle anonymous users gracefully?

---

## 17. Launch, Versioning, and Deployment

### Version Flow
```
Playtest (npm run dev)
  -> Upload (npx devvit upload --bump patch)    [Private, for you]
  -> Publish (npx devvit publish --bump minor)   [Submit for review]
  -> Review (1-2 business days typically)
  -> Approved -> Install on subreddits
```

### Commands
```powershell
npx devvit upload --bump patch       # v0.0.0.1 -> v0.0.0.2
npx devvit upload --bump minor       # v0.0.0.1 -> v0.0.1.0
npx devvit publish --version 1.0.0   # Exact version
npx devvit publish --public          # Make public in App Directory
npx devvit install r/subreddit       # Install on a subreddit
npx devvit install r/sub --version 1.0.0  # Specific version
```

### Review Tips
- README.md must be clear and accurate
- Test on mobile AND web
- Test with multiple accounts (including non-mod)
- Document fetch domains in README if using external APIs
- Apps with payments, `runAs: 'USER'`, or external fetch take longer

### Critical: Update After Upload
Publishing a new version does NOT auto-update installed subreddits. Each must update via:
- CLI: `npx devvit install r/subreddit`
- Web: developers.reddit.com/apps > Installed in communities > blue "Update" button

---

## 18. Ready-to-Use Code Templates

### Template A: Simple Notification Bot (single trigger file + devvit.json)
```json
// devvit.json — triggers + settings + permissions
{
  "triggers": {
    "events": { "ModMail": { "endpoint": "/internal/triggers/modmail" } }
  },
  "settings": {
    "subreddit": {
      "webhookURL": { "type": "string", "label": "Slack/Discord Webhook URL" }
    }
  },
  "permissions": { "http": { "enable": true }, "redis": { "enable": true } }
}
```
```typescript
// src/server/index.ts
import express from 'express';
import { createServer, redis, context, getServerPort } from '@devvit/web/server';
const app = express();
const router = express.Router();

router.post('/internal/triggers/modmail', async (req, res) => {
  const { conversationId } = req.body;
  const dedupKey = `handled~${conversationId}`;
  if (await redis.exists(dedupKey)) return res.json({ status: 'ok' });
  await redis.set(dedupKey, 'true', { expiration: addDays(new Date(), 28) });

  const webhook = await context.settings.get<string>('webhookURL');
  if (webhook) await fetch(webhook, { method: 'POST', body: JSON.stringify({ text: `New Modmail` }) });
  res.json({ status: 'ok' });
});

app.use(router);
createServer(app).listen(getServerPort());
```

### Template B: Mod Tool with Menu Action (Devvit Web)
```json
// devvit.json
{
  "menu": {
    "items": [{
      "label": "Restrict to Flaired",
      "location": "post",
      "forUserType": "moderator",
      "endpoint": "/internal/menu/restrict"
    }]
  }
}
```
```typescript
// src/server/index.ts — Express routes
router.post('/internal/menu/restrict', async (req, res) => {
  // Menu action handlers return UiResponse
  res.json({ showForm: {
    title: 'Restrict Post',
    fields: [{ name: 'duration', type: 'number', label: 'Hours', required: true }],
    acceptLabel: 'Apply'
  }});
});
// storage.ts — Redis CRUD: storePostSettings, getPostSettings, clearPostSettings
// settings.ts — Form field definitions + validators in devvit.json
```

### Template C: Game with Express Backend
```typescript
// src/server/index.ts
import express from 'express';
import { createServer, redis, context, getServerPort } from '@devvit/web/server';
const app = express(); app.use(express.json());

app.get('/api/leaderboard', async (req, res) => {
  const top10 = await redis.zRange('highscores', 0, 9, { by: 'rank' });
  res.json({ leaderboard: top10 });
});

app.post('/api/save-score', async (req, res) => {
  const current = await redis.zScore('highscores', context.username);
  if (!current || req.body.score > current) {
    await redis.zAdd('highscores', { member: context.username, score: req.body.score });
  }
  res.json({ success: true });
});

createServer(app).listen(getServerPort());
```

### Template D: Cron Job Post Creator
```json
// devvit.json
"scheduler": { "tasks": { "daily-post": { "endpoint": "/internal/scheduler/daily-post", "cron": "0 9 * * *" } } }
```
```typescript
router.post('/internal/scheduler/daily-post', async (req, res) => {
  await reddit.submitCustomPost({
    subredditName: context.subreddit,
    title: 'Daily Thread - ' + new Date().toLocaleDateString(),
    entry: 'default',
  });
  res.json({ status: 'ok' });
});
```

### Template E: Mobile-Friendly Multi-Step Overlay
```html
<div class="overlay" id="form-overlay">
  <div class="overlay-header"><h2>Create Event</h2><button class="close-btn">X</button></div>
  <div class="overlay-body" id="step-1">
    <input placeholder="Title" class="input-field">
    <input placeholder="Organizer" class="input-field">
  </div>
  <div class="overlay-body hidden" id="step-2">
    <input type="date" class="input-field">
    <input type="time" class="input-field">
  </div>
  <div class="overlay-footer">
    <button class="btn-prev hidden">Back</button>
    <button class="btn-next">Next</button>
    <button class="btn-submit hidden">Submit</button>
  </div>
</div>
```
```css
.overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000;
  background: var(--bg); overflow-y: auto; -webkit-overflow-scrolling: touch; }
.hidden { display: none !important; }
.input-field { padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px; }
.overlay-footer { display: flex; justify-content: space-between; padding: 12px 16px; border-top: 1px solid #eee; }
```
```typescript
// JS: Use addEventListener for all buttons
document.querySelectorAll('.btn-next').forEach(btn => {
  btn.addEventListener('click', () => { /* advance step */ });
});
// Use data-* attributes for parameters: <button data-id="123">
```

---

## Quick Reference: Do's and Dont's

| DO | DON'T |
|----|-------|
| Use `addEventListener` for clicks | Use `onclick` attributes in HTML |
| Pass `settings.get("key")` with key | Call `settings.get()` without args |
| Use `/api/*` for client, `/internal/*` for triggers | Mix client and internal routes |
| Break long forms into steps (2 fields max) | Build single long scrollable forms on mobile |
| Cache modlist as CSV string in Redis | Call `getModerators()` on every trigger |
| Use `Promise.allSettled` for independent ops | Use `Promise.all` when failures should be isolated |
| Use Redis TTL for automatic cleanup | Rely on cron jobs alone to clean stale keys |
| Handle `[ Removed by Reddit ]` with cache fallback | Trust live content to always be available |
| Click "Update" on developer portal after upload | Assume upload auto-updates installed subreddits |
| Use `zScore` with `!= null` check | Use `zScore` with `!== null` (returns undefined) |
| Store settings as JSON on wiki for complex configs | Try to fit everything in settings fields |
| Use `@devvit/web/server` imports | Use `@devvit/public-api` for server code in new apps |
| Build server to CJS, client to ESM | Use same module format for both |
| Use CRON scheduler for ALL background tasks | Use one-shot `scheduler.runJob()` in inline context |
| Use `hDel(key, [field])` with array | Call `hDel(key, field)` with bare string |
| Debounce tab clicks with loading flag | Allow rapid clicks to fire parallel API calls |
| Call `bindButtons()` after every DOM mutation | Assume event listeners survive innerHTML changes |
| Use `context.subredditName \|\| context.subreddit` | Use only `context.subreddit` (can be undefined) |
| Check `postId.startsWith("t3_")` before using in APIs | Assume postId always has t3_ prefix (it doesn't) |
| Use in-app confirmation UI | Use browser `confirm()` (blocked by CSP) |
| Split sensitive data (Mod view vs Public view) | Show email/phone to all users |
| Use **Devvit Web** (`@devvit/web`) for ALL new apps | Use `@devvit/public-api` (Blocks — removed in v0.13, ends June 30, 2026) |
| Migrate old Blocks apps to Devvit Web before June 30 | Ignore the June 30 Blocks removal deadline |
| Use `fetch('/api/...')` for client→server communication | Use `window.parent.postMessage` (old Blocks bridge pattern) |
| Use `showForm()` from `@devvit/web/client` for forms | Build custom HTML forms with validation from scratch |
| Use `@devvit/web/client` imports for frontend APIs | Import browser-only APIs in Devvit server code |
| Use Reddit API via `reddit.*` methods for data | Fetch `reddit.com/r/.../.json` unauthenticated (blocked since May 28, 2026) |
| Design for Logged Out Users (showLoginPrompt for gated features) | Assume every user is always logged in |

---

> Built from: Reddit Devvit official docs + 40+ community repos analyzed for production patterns.
> Questions? Join r/devvit or the Devvit Discord: https://developers.reddit.com/discord

