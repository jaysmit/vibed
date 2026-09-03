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

### 9 — Inline Editing ✅ DONE (2026-09-02)
Edit icons on venture page for owners. Click to edit inline, save without page reload.

**Completed:**
- ElevatorPitchEditable component wraps pitch, problem, who fields
- Edit icon appears on hover for owners
- Uses existing InlineEdit component
- Saves via PATCH API with router.refresh()

---

### 10 — Email ✅ DONE (2026-09-02)
Resend integration for weekly digests and founder nudges.

**Completed:**
- Resend client with lazy initialization
- Email templates: layout, weekly-digest, founder-nudge
- Digest service: getUsersForDigest, getVentureUpdates, sendWeeklyDigests
- Founder nudge service: getIdleFounders, sendFounderNudges
- Cron routes: /api/cron/digest (Mondays 9am), /api/cron/nudge (Wednesdays 10am)
- Vercel cron configuration in vercel.json

**Env vars needed:**
- RESEND_API_KEY
- CRON_SECRET (for production auth)

---

### 11 — Trending ✅ DONE (2026-09-02)
Scoring algorithm with time decay. Staff picks boost.

**Completed:**
- lib/services/trending.ts with calculateTrendingScore, recalculateAllTrendingScores
- getTopClipsByPillar for landing page
- Scoring: views, endorsements, founder endorsements, follows, watch %, rewatches
- Time decay (5% per day)
- Staff pick boost (+20)

---

### 12 — Follow System ✅ DONE (2026-09-02)
Backend + UI for follow button on venture pages.

**Completed:**
- FollowButton component wired to venture page
- lib/services/follows.ts (follow, unfollow, isFollowing)
- /api/follow route
- Counter updates on ventures

---

### 13 — Promise Creation ✅ DONE (2026-09-02)
UI for founders to create/edit promises. Promise resolution workflow.

**Completed:**
- createPromise, completePromise in ventures service
- /api/ventures/[id]/promise route (POST create, PATCH complete)
- PromiseEditor component (create form, kept/missed buttons)
- Promise history tracking

---

### 14 — Compliance ✅ DONE (2026-09-02)
Privacy policy and terms of service pages.

**Completed:**
- /privacy page
- /terms page
- Footer links on landing page

---

### 15 — Comments ✅ DONE (2026-09-02)
Comment system for clips with reply threading.

**Completed:**
- comments table (migration 004) with reply_to support
- lib/services/comments.ts (create, delete, getByClip, getReplies)
- CommentSection component with nested replies
- /api/clips/[id]/comments (GET, POST)
- /api/comments/[id] (GET replies, DELETE)
- Soft delete pattern

---

### 16 — Feedback System ✅ DONE (2026-09-02)
Bug reporting and user help functionality.

**Completed:**
- feedback table (migration 005) with status workflow
- FeedbackWidget (floating button, 3-step modal)
- Screenshot attachment with base64 encoding
- Auto-capture browser info and page URL
- Email notification via Resend
- Enhanced /help page with searchable FAQs (7 categories)

---

### 17 — UI Improvements ✅ DONE (2026-09-02)
Header reorganization and filter improvements.

**Completed:**
- Header: Profile button visible, Following moved to dropdown
- Discover page: collapsible filter sections (Watch, Industry, Stage)
- Venture page: clips sort/filter (Recent, Popular, Oldest + segment filter)
- Founder card links to profile page

---

### 18 — Landing Page Redesign ✅ DONE (2026-09-03)
Section naming, layout improvements, intro video.

**Completed:**
- Header restructured: logo + search left, Discover centered (bold), auth right
- DiscoverLink component for centered nav
- Section names: Trending Elevator Pitches, Trending Maker Moments, Trending Growth Hacks, Trending Pivot Points
- Added "Trending Ventures" section with VentureCards (sorted by followers)
- Mobile: horizontal scroll for all sections (scrollbar-hide utility)
- Card sizing: ~10% smaller desktop, ~20% smaller mobile
- Reduced section padding and gaps throughout
- Hero intro video placeholder for logged-out users
- Desktop: video side-by-side, height matches text block
- Mobile: tagline + video only (description hidden)

---

## Not in the MVP

In-app notifications · social embeds · search beyond title matching · the podcast feed · shorts export with watermark.

Shorts export is the next priority — it is the distribution loop.
