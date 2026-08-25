# Build plan

Vertical slices. Each one ships something that works end to end. Do not start the next until the current one runs.

---

### 0 — Scaffold
Next.js + TypeScript + Tailwind, ESLint, Prettier, `npm run typecheck`. Design tokens from `CLAUDE.md` into the Tailwind config. Folder structure from the architecture doc, with empty `lib/domain`, `lib/services`, `lib/db`. Railway `web` service deploying from GitHub, health check at `/api/health`.

**Done when:** a blank styled page is live on a Railway URL.

---

### 1 — Data layer
Mongoose connection cached on `globalThis`. Models: `users`, `founders`, `ventures`, `clips`, `follows`, `events`. Indexes from the architecture doc. A seed script that loads the seven ventures from the prototype.

**Done when:** `npm run seed` populates Atlas and a script can read a venture back.

---

### 2 — Public read paths (server-rendered)
`/` landing, `/v/[slug]` with three tabs, `/q/[slug]`, `/answers`, `/shorts`, `/postmortems`. Real data, no auth, no video yet — posters render the generated SVG art from the prototype.

**Done when:** every page in the prototype exists at a real URL and renders from the database with JavaScript disabled.

---

### 3 — Events
`lib/services/events.ts` plus `/api/track`. Log the full taxonomy: progress, engagement, discovery (with rail name and position), founder-side. Rate limit the endpoint and treat all client-sent events as untrusted.

**Done when:** loading the landing page writes impression events with rail and position.

---

### 4 — Auth and follow
Auth.js with the Mongo adapter, email magic link. `/login`, `/signup`, `/following`. Follow writes the row and `$inc`s the counter. Following while signed out opens signup and applies the follow after.

**Done when:** I can sign up, follow a venture, and see it on `/following` after a refresh.

---

### 5 — Founder editor
`/start` wizard (three steps, matching the prototype), `/dashboard`, `/v/[slug]/edit`. Segment editing. Standards checklist gates publish, and controls the `noindex` tag.

**Done when:** a new account can create a venture, fill it in, and publish it once standards are met.

---

### 6 — Video
Mux signed direct uploads, webhook with signature verification, transcript ingest into `clips.transcript`. Player with scrubber and click-to-seek transcript. `VideoObject` schema.

**Done when:** I can upload a clip from the editor and it plays on the profile with a working transcript.

---

### 7 — Email
Resend. Weekly digest driven by rung changes and promise resolutions in the last seven days. Founder nudge when they have not posted in 12 days.

**Done when:** the digest sends on a Railway cron and links are UTM-tagged.

---

### 8 — Trending
Worker service. Aggregation over `events` every 15 minutes writing `counters.trendingScore`. Reserved slot for a never-featured venture; three-day cooldown. Rules in `lib/domain/scoring.ts` with tests.

**Done when:** the rail order changes based on real events and I can explain why any card ranked.

---

## Not in the MVP

Comments · in-app notifications · social embeds · search beyond title matching · the podcast feed · shorts export with watermark.

Shorts export is the first thing after this list — it is the distribution loop.
