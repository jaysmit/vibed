# Vibed — architecture

Railway + MongoDB. Written so the MVP ships fast without painting you into a corner.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js (App Router)** on Railway | Server-rendered pages. Your transcripts are the SEO asset — an SPA renders nothing for a crawler. Also gives you API routes, so one service, one deploy. |
| DB | **MongoDB Atlas** (not Railway's Mongo) | Atlas free tier → M10 is a smoother path than a Railway container, and you get backups, alerts and Atlas Search included. Connect over `MONGODB_URI`. |
| ODM | **Mongoose** | Schema validation at the app layer, which Mongo won't give you. |
| Video | **Mux** or **Cloudflare Stream** | Never host video on Railway. Encoding, adaptive bitrate and egress will bankrupt you. Both give signed direct uploads and auto-transcription. |
| Images | **Cloudflare Images** or S3 + Sharp | Fixed aspect ratios, re-encoded server-side. |
| Auth | **Auth.js (NextAuth)** with the Mongo adapter | Email magic link first, OAuth later. Don't hand-roll sessions. |
| Jobs | **Second Railway service** running BullMQ, or Railway Cron | Digests, trending recompute, transcript polling. |
| Cache/queue | **Railway Redis** (Phase 2) | Rate limiting, job queue, hot feed cache. |
| Email | **Resend** | The weekly digest is a product surface, not a side channel. |

**Railway layout:** three services in one project — `web` (Next.js), `worker` (jobs), `redis`. Mongo lives in Atlas.

---

## 2. Repo structure

```
/app                          # routes only — thin
  /(public)
    page.tsx                  # landing
    /v/[slug]/page.tsx        # profile: pitch
    /v/[slug]/journey/page.tsx
    /v/[slug]/media/page.tsx
    /q/[slug]/page.tsx        # question grid
    /rung/[key]/page.tsx
  /(app)
    /dashboard/page.tsx       # founder view
    /v/[slug]/edit/page.tsx
  /api
    /webhooks/mux/route.ts
    /track/route.ts           # client event ingest
  layout.tsx
  middleware.ts

/components                   # presentational, no data access
  /venture      Card, Poster, PromiseClock, RungLadder
  /journey      SegmentList, Segment, ReelRail
  /player       Player, Transcript, Scrubber
  /ui           Button, Pill, Card, Avatar

/lib
  /db
    connect.ts                # cached connection (critical — see §7)
    /models                   # Mongoose schemas ONLY
    /repos                    # every query lives here, nothing else
  /services                   # business logic
    ventures.ts  promises.ts  events.ts  trending.ts  media.ts
  /domain                     # pure functions, no I/O, unit tested
    rungs.ts  segments.ts  standards.ts  scoring.ts
  /auth        session.ts  guards.ts
  /validation  schemas.ts     # Zod, shared client + server

/workers
  digest.ts  trending.ts  transcripts.ts
```

### Import rules — the three that stop it rotting

1. **Components never query.** They receive plain objects as props. The moment a card fetches, your feed is N+1 and you can't cache anything.
2. **Routes never touch models.** `page.tsx` → `services` → `repos` → `models`. Four layers sounds like overkill at MVP; it's the reason you can swap Mongo queries for an aggregation later without touching a page.
3. **`/lib/domain` imports nothing.** Rung logic, standards checks, trending maths are pure functions. They're the part you'll get wrong twice, so they need to be testable without a database.

Enforce with path aliases (`@/lib/...`) and, when you care, `eslint-plugin-boundaries`.

---

## 3. Data model

Mongo rewards embedding bounded things and referencing unbounded ones.

**`users`** — `{ email, name, handle, role, createdAt }`
**`founders`** — `{ userId, name, slug, bio, location, links[], avatarKey }`

**`ventures`** — the hub document
```js
{
  slug, founderId, name, pitch, brand, glyph,
  rung, rungEnteredAt, status,             // draft|live|graduated|closed
  media: { tier: 'video'|'photo', coverKey },
  links: { site, siteStatus, ig, x, yt, tiktok },
  problem, who, why,                        // required story fields
  segments: {                               // EMBEDDED — bounded at 16
    pitch: { body, publishedAt, updatedAt },
    spark: { ... }
  },
  promise: { text, dueAt, createdAt },
  promiseHistory: [{ text, dueAt, resolvedAt, kept, note }],
  counters: {                               // DENORMALISED — see §4
    followers, clips, photos, likes, comments,
    weekNumber, streakWeeks, lastPostedAt,
    siteClicks30d, trendingScore
  },
  standards: { met: 6, of: 7, checkedAt },
  publishedAt
}
```

**`clips`** — separate, because the question grid queries *across* ventures
```js
{ ventureId, founderId, questionSlug, title, hook, tagline,
  muxAssetId, playbackId, durationSec, thumbTime,
  transcript: [{ t, line }], transcriptStatus,
  segmentKey, counters: { views, completes, likes, comments },
  publishedAt }
```

**`follows`** — `{ userId, targetType, targetId, createdAt }`
**`comments`**, **`likes`** — standard, with `targetType`/`targetId`
**`events`** — see next section. This is the important one.

### Indexes (do these now, not later)
```js
ventures: { slug: 1 } unique
          { status: 1, 'counters.trendingScore': -1 }
          { rung: 1, publishedAt: -1 }
clips:    { questionSlug: 1, publishedAt: -1 }   // powers the question grid
          { ventureId: 1, publishedAt: -1 }
follows:  { userId: 1, targetId: 1 } unique
          { targetId: 1, createdAt: -1 }
events:   { ventureId: 1, at: -1 }
          { type: 1, at: -1 }
          { at: -1 }
```

---

## 4. Counters are denormalised on purpose

Mongo has no cheap join. If your landing page counts followers per venture at request time, seven ventures is fine and seven hundred is a timeout.

So: `ventures.counters` is written by services and workers, never computed in a page query. Every follow does two writes — insert into `follows`, `$inc` the counter. If they drift, a nightly job recomputes from source. Drift is acceptable; a slow homepage is not.

---

## 5. Track everything now (your actual ask)

One append-only collection, written from day one, even though nothing reads it yet. This is what lets you write trending rules in three months against real history instead of guessing.

```js
// events
{
  _id, at,                       // always index on at
  type,                          // see taxonomy
  actorId,                       // user, or null if anonymous
  anonId,                        // cookie id for logged-out
  ventureId, clipId, questionSlug,
  meta: {},                      // type-specific, unstructured on purpose
  session, ua, country, referrer
}
```

**Progress events** — the ones only your site knows
```
venture.created          venture.published        venture.rung_changed
segment.published        segment.updated
promise.created          promise.kept             promise.broken
clip.uploaded            clip.published           transcript.ready
standards.met            standards.lapsed
venture.graduated        venture.closed
```

**Engagement events**
```
clip.view_start          clip.progress (meta:{pct})   clip.complete
clip.like                clip.share                   clip.unlike
comment.created          comment.deleted
follow.created           follow.removed
venture.profile_view     segment.expanded
site_click               social_click
```

**Discovery / attribution — how they got there**
```
rail.impression (meta:{rail,position,ventureId})
rail.click      (meta:{rail,position})
search.query    (meta:{term,results})
question.view
digest.sent  digest.open  digest.click
signup.started  signup.completed (meta:{trigger,ventureId})
```

**Founder-side**
```
founder.login  founder.editor_open  founder.publish_attempt
founder.standards_view
```

### Rules that make this survive
- **Never delete.** Corrections are new events.
- **`meta` is untyped.** Resist normalising it — you don't know what you'll need.
- **Log impressions, not just clicks.** Without impressions you can't compute click-through, and CTR is the only honest ranking signal.
- **Log position in the rail.** Position three always beats position nine; without it your engagement data is really a position measurement.
- **Anonymous events matter more than logged-in ones** early, because most visitors won't have accounts.
- **TTL the noisy ones.** `clip.progress` at 6-month expiry; keep progress events aggregated into `clips.counters` daily.

At volume this becomes a time-series collection or ships to ClickHouse. Not now.

### Trending, when you turn it on
Aggregation pipeline over `events`, run every 15 minutes by the worker, writing `ventures.counters.trendingScore`:

```
score = Σ(event_weight × e^(-age_hours/72))     // progress events dominate
      × (1 + normalised_engagement_rate)         // rate, not total
      × health_multiplier                        // posted in 14d, standards met
```

Reserve one rail slot for a venture never featured, and cool down anything that held the rail three days running. Both are business rules living in `/lib/domain/scoring.ts`, not in the query.

---

## 6. Security

**Auth**
- Auth.js, httpOnly + Secure + SameSite=Lax cookies. No JWTs in localStorage.
- If you ever hand-roll: Argon2id, never bcrypt-with-defaults, never SHA.
- Roles: `visitor | user | founder | admin`. Founder ≠ owner — ownership is per-venture.

**Authorisation — the one people get wrong**
- Every mutation re-checks ownership **server-side**, from the session, against the document. Never trust a `founderId` in a request body.
- `middleware.ts` does cheap gating only (is there a session, is this route protected). Real checks live in the service.
- Draft ventures 404 for everyone but the owner. Not 403 — 403 confirms it exists.

**Input**
- Zod at every boundary; parse, don't validate.
- **Mongo operator injection is your specific risk.** A body of `{ email: { $ne: null } }` becomes a query that matches everything. Strip any key starting with `$` or containing `.` before it reaches a query. `express-mongo-sanitize` equivalent, or explicitly cast every value.
- Never pass user input into `$where` or `mapReduce`.

**Uploads**
- Video: client requests a signed upload URL from your API, uploads **direct to Mux**, Mux webhooks you when ready. Your server never touches the bytes.
- **Verify the webhook signature.** An unsigned webhook endpoint is a public write API.
- Images: re-encode server-side with Sharp, fixed dimensions, strip EXIF. EXIF carries GPS — a van-life founder uploading a photo of where they slept is publishing their location.
- Cap file size at the signed-URL step, not after the upload.

**Rate limits** (Redis, or Mongo TTL collection at MVP)
- Auth: 5/15min per IP+email
- Comments: 10/hour per user
- Upload URL requests: 20/day per venture
- `/api/track`: 100/min per anon id, and treat all of it as untrusted — someone will forge view counts

**Headers** — `next-safe-middleware` or manual: CSP (script-src self + Mux), HSTS, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin.

**Secrets** — Railway env vars only. Never `NEXT_PUBLIC_` anything secret; that prefix ships it to the browser. Rotate `MONGODB_URI` if it ever lands in a log.

**Moderation** — every clip and comment gets a `reports` count and a `hidden` flag. Human review while you're small. Video can't be skimmed like text, so budget for it.

**Privacy** — you're storing founders' business narratives and possibly revenue. Ship a delete path early: soft-delete the venture, purge Mux assets, tombstone the events (keep `type` and `at`, drop identifiers).

---

## 7. Railway specifics

**Connection caching.** Serverless-style reloads will exhaust your Mongo connection pool. Cache the connection on `globalThis`:
```js
let cached = global._mongoose ??= { conn: null, promise: null };
```
This bites everyone once.

**Health check** at `/api/health` — Railway restarts on failure. Check Mongo with a `ping`, not just a 200.

**Two services, one repo.** `web` runs `next start`, `worker` runs `node workers/index.js`. Same Dockerfile, different start command.

**Deploy** is the flow you already use: push to GitHub, Railway builds. Add a staging environment before you have real founders on there.

---

## 8. Phases

| Phase | What | Cost |
|---|---|---|
| **0** — now | Ten hand-made stories. Next.js + Atlas free tier. Events logged from day one. No Redis, no worker. | ~$5 |
| **1** — first founders | Auth, editor, Mux uploads, follows, digest via Railway Cron. | ~$25 + Mux usage |
| **2** — 500 ventures | Redis, worker service, trending job, feed caching, moderation queue. | ~$60 |
| **3** — scale | Atlas M10+, read replicas, CDN in front of Next, events to ClickHouse. | $200+ |

Video is the line item that scales with success rather than revenue. Model it before you invite the fiftieth founder.

---

## 9. Environment variables

```
MONGODB_URI=
NEXTAUTH_URL=            NEXTAUTH_SECRET=
MUX_TOKEN_ID=            MUX_TOKEN_SECRET=       MUX_WEBHOOK_SECRET=
CLOUDFLARE_IMAGES_TOKEN=
RESEND_API_KEY=
REDIS_URL=               # phase 2
NEXT_PUBLIC_SITE_URL=    # safe to expose — nothing else with this prefix
```

---

## 10. Build order

1. Mongo connection + models + `events` collection with the full taxonomy.
2. Public read paths: landing, profile, question grid — server-rendered, seeded from your ten stories.
3. Auth + follow. Log every event from the first commit.
4. Founder editor with the standards checklist gating publish.
5. Mux upload + webhook + transcript ingest.
6. Digest email.
7. Only then: trending, cached against three months of real events.
