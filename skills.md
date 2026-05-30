# Devvit App Development â€” LLM Agent Skills Reference

> **Purpose:** Comprehensive reference for coding agents and vibe coders to build Reddit Devvit apps. Covers architecture, Redis, triggers, schedulers, bridges, game integration, MCP, Stitch, and 30+ repo patterns.

---

## 1. Vibe Coder Quickstart Guide

### Prerequisites
- Node.js v22.2.0+, VS Code, Reddit account, GitHub account
- Install CLI: `npm install -g @devvit/cli` (on Windows: `devvit-cli`, NOT `devvit`)

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

```
What are you building?

  Mod Tool - "Bare" template
    Triggers + Menu Actions + Redis. No UI needed.

  Game - "React" or "Phaser/Three.js" template
    Devvit Web (HTML/iframe) + Redis + Scheduler. Client/Server split with HTTP API.

  Notification Bot - "Bare" template
    Triggers + HTTP fetch (webhooks). Single file is fine.

  Community App - "React" template
    Devvit Web + Redis + Scheduler. Full client/server with multi-step UI.

  Data/Utility Library - Monorepo
    Separate packages: pure TS lib + thin Devvit wrapper.
```

### Inline vs Expanded
| Aspect | Inline (`inline: true`) | Expanded |
|--------|------------------------|----------|
| Behavior | Loads directly in post | Shows "Launch App" button |
| Use for | Games, simple tools | Complex apps with large UIs |
| External requests | Blocked from client | Allowed |
| Mobile scrolling | Cannot scroll internally | Can scroll |

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
- Use `@devvit/web/server` imports (NOT `@devvit/public-api`) for server code
- Routes: `/api/*` = client calls, `/internal/*` = triggers/scheduler/menu
- NEVER use `onclick` attributes in HTML - always `addEventListener`
- Always include hardcoded fallback data in HTML for instant rendering
- Redis writes are eventually consistent - don't immediately verify writes

---

## 4. Server Architecture Patterns

### Available Server APIs
| API | Import from | Usage |
|-----|------------|-------|
| `redis.get/set/hGetAll/hSet/hDel/zAdd/zCard/zScore/zRem/zRange` | `@devvit/web/server` | Data persistence |
| `reddit.submitCustomPost/getModerators/getCommentById/sendPrivateMessage` | `@devvit/web/server` | Reddit actions |
| `context.username/subreddit/postId/postData` | `@devvit/web/server` | Request metadata |
| `scheduler.runJob` | `@devvit/web/server` | Schedule jobs |
| `settings.get(key)` | `@devvit/web/server` | Read settings |
| `getServerPort()` | `@devvit/web/server` | Auto-detect port |
| `navigateTo(url)` | `@devvit/web/client` | Navigate in Reddit browser |

### NOT Available in Devvit Web
- `reddit.modMail.createConversation()` - Not available
- `scheduler.on("name", handler)` - Does not exist; use endpoint-based scheduler instead
- `settings.get()` without args - Returns undefined; always pass key

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

### Community Library Ecosystem (from 30+ repos)

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
| `toolbox-devvit` | modmail-userinfo | Toolbox wiki-as-database integration |

### Devvit-Specific Imports
```typescript
// Server (src/server/) — available as magical imports
import { context, redis, reddit } from '@devvit/web/server';
import type { UiResponse, TriggerResponse } from '@devvit/web/shared';

// Client (src/client/) — browser-safe Devvit APIs
import { getWebViewMode, requestExpandedMode, showForm, showToast, navigateTo } from '@devvit/web/client';

// Build tooling
import { devvit } from '@devvit/start/vite';  // Vite plugin
import { getServerPort, createServer } from '@devvit/web/server';  // Server boot
```

---

## Devvit v0.13 (May 2026) — New Capabilities

### Push Notifications (`@devvit/notifications` — experimental)
```typescript
import { notifications } from '@devvit/notifications';
await notifications.optInCurrentUser();
await notifications.enqueue({
  title: 'Your daily reward!', body: 'Come back and play',
  recipients: [{ userId: 'abc', data: { streak: '5' } }], // Mustache: {{streak}}
});
```
Rate limits: 2/user/day, 25K/app/day. Built-in opt-in/opt-out UX.

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

### Post Styles + User Actions
```typescript
await reddit.submitCustomPost({ styles: { backgroundColor: { light: '#FFF', dark: '#000' } } });
await post.setCustomPostStyles({ shareImageUrl: 'https://...' });
// runAs: 'USER' now requires app review approval
```

### Scheduler: Second-Level Cron (experimental)
6-part cron: `*/30 * * * * *` = every 30 seconds.

### Realtime (Devvit Web only, removed from public-api)
```typescript
await realtime.send(channel, msg); // Server. No ':' in channel names.
const conn = connectRealtime({ channel, onMessage }); // Client
```

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

### IMPORTANT: Blocks is deprecated. Use Devvit Web (`@devvit/web/server`) for all new apps.

### Old Pattern (deprecated - useWebView):
```typescript
const { mount, postMessage } = useWebView({
  url: 'index.html',
  onMessage: async (ev) => {
    switch (ev.type) {
      case 'save:score': await redisService.saveScore(ev.data.score); break;
      case 'request:stats': postMessage({ type: 'update:stats', data: stats }); break;
    }
  },
});

// WebView side:
window.parent.postMessage({ type: 'save:score', data: { score: 100 } }, '*');
window.addEventListener('message', (ev) => {
  if (ev.data.type !== 'devvit-message') return; // Devvit wraps in devvit-message
  const { message } = ev.data.data;
  // handle message
});
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
| Tab rapid-click causes API flood | Add debounce flag: `if (loading) return; loading = true;` |

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

### Template A: Simple Notification Bot (single-file)
```typescript
Devvit.configure({ redditAPI: true, redis: true, http: true });
Devvit.addTrigger({ event: 'ModMail', onEvent: async (event, context) => {
  const conversation = await context.reddit.modMail.getConversation({ conversationId: event.conversationId });
  const webhook = await context.settings.get<string>('webhookURL');
  if (webhook?.startsWith('https://hooks.slack.com/')) {
    await fetch(webhook, { method: 'POST', body: JSON.stringify({ text: `*New Modmail:* ${conversation.subject}` }) });
  }
}});
```

### Template B: Mod Tool with Menu Action (4-file)
```typescript
// main.ts - Wiring
Devvit.addMenuItem({ label: 'Restrict to Flaired', location: 'post', forUserType: 'moderator', onPress: showForm });
// handlers.ts - Logic + forms
// storage.ts - Redis CRUD: storePostSettings, getPostSettings, clearPostSettings
// settings.ts - Form field definitions + validators
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

---

> Built from: Reddit Devvit official docs + 30+ community repos analyzed for production patterns.
> Questions? Join r/devvit or the Devvit Discord: https://developers.reddit.com/discord

