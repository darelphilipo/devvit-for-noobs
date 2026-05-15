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

### Server Frameworks
- **Express**: Most common, manual routing with `express.Router()`
- **Hono**: Used in React template, lighter weight
- **tRPC**: Used in HotAndCold for type-safe RPC over `/api`

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

---

## 6. Trigger Architecture

### Available Triggers
```typescript
Devvit.addTrigger({ event: 'PostCreate' / 'PostSubmit', onEvent: handler });
Devvit.addTrigger({ event: 'CommentCreate' / 'CommentSubmit', onEvent: handler });
Devvit.addTrigger({ event: 'PostUpdate' / 'CommentUpdate', onEvent: handler });
Devvit.addTrigger({ event: 'PostDelete' / 'CommentDelete', onEvent: handler });
Devvit.addTrigger({ event: 'ModAction', onEvent: handler });
Devvit.addTrigger({ event: 'ModMail', onEvent: handler });
Devvit.addTrigger({ events: ['AppInstall', 'AppUpgrade'], onEvent: handler });
Devvit.addTrigger({ event: 'PostFlairUpdate', onEvent: handler });
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
  <!-- Default visible immediately -->
  <div class="event-card"><h3>Loading events...</h3></div>
  <!-- Live data replaces this when API responds -->
</div>
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

