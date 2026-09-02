# Build plan

Vertical slices. Each one ships something that works end to end. Do not start the next until the current one runs.

---

### 0 — Scaffold ✅ DONE
Next.js + TypeScript + Tailwind, ESLint, Prettier, `npm run typecheck`. Design tokens from `CLAUDE.md` into the Tailwind config.

**Completed:** Next.js 15, Tailwind 4, design tokens in globals.css, folder structure, health endpoint. Deployed to Vercel.

---

### 1 — Data layer ✅ DONE
Supabase tables: founders, ventures, clips, follows, events, venture_members.

**Completed:** All tables with indexes, RLS policies, service functions.

---

### 2 — Public read paths ✅ DONE
`/` landing, `/v/[slug]` with tabs, `/q/[slug]`, `/answers`, `/postmortems`, `/discover`.

**Completed:** Landing page with 7 content pillars, venture profile with Journey/Clips/Promises/Updates tabs, discover with filters.

---

### 3 — Events ✅ DONE
`lib/services/events.ts` plus `/api/track`. Full event taxonomy.

**Completed:** Event logging, tracking components, rate limiting.

---

### 4 — Auth ✅ DONE
Supabase Auth with email/password. `/login`, `/signup`, `/following`.

**Completed:** Email/password auth, session management, protected routes, header with user dropdown.

---

### 5 — Founder editor ✅ DONE
`/start` wizard, `/dashboard`, `/v/[slug]/edit`. Segment editing. Standards checklist gates publish.

**Completed:**
- 4-step /start wizard (name, team, country, categories)
- Dashboard with venture management
- Edit page with Basics/Segments/Videos tabs
- **Flexible timeline system** - segments have happenedAt date picker for retroactive documentation
- Progress ring and completion calculation
- Publish gating based on completion percentage (7 requirements)
- Owner controls (Settings dropdown, progress indicator)

---

### 6 — Video ✅ DONE
Mux signed direct uploads, webhook with signature verification, transcript ingest.

**Completed:** VideoUploader, VideoPlayer, Mux webhook, clip management.

---

### 7 — Team System ✅ DONE
Invite team members, accept invitations, role management.

**Completed:**
- venture_members table with roles (founder, partner, team_member)
- Invitation tokens and accept flow
- Team management in /start wizard
- Master user (creator) distinction

---

### 8 — UI Redesign ✅ DONE (2026-09-01)
Instagram-style cards, content pillars, Stats Bar, flexible timeline.

**Completed:**
- PitchCard - square video thumbnails, play overlay, likes, category, team dropdown
- Landing page content pillars (Distribution, First Dollar, Challenges, Building Now, etc.)
- Stats Bar on venture page
- Promises tab with timeline
- Video content category filters on Discover
- JourneyAccordion with happenedAt dates
- Date picker in segment editor

---

### 9 — Inline Editing 🔜 NEXT
Edit icons on venture page for owners. Click to edit inline, save without page reload.

**To build:**
- InlineEdit wrapper component
- Edit icons on hover for editable fields
- PATCH API for partial venture updates
- Optimistic UI updates

---

### 10 — Email
Resend. Weekly digest driven by rung changes and promise resolutions. Founder nudge when idle.

---

### 11 — Trending
Worker service. Aggregation over `events` every 15 minutes writing `counters.trendingScore`.

---

### 12 — Follow System
Backend implementation for follow button. Counter updates. /following page data.

---

### 13 — Promise Creation
UI for founders to create/edit promises. Promise resolution workflow.

---

## Not in the MVP

Comments · in-app notifications · social embeds · search beyond title matching · the podcast feed · shorts export with watermark.

Shorts export is the first thing after this list — it is the distribution loop.
