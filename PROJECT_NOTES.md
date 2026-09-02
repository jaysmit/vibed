# Vibed - Project Notes

## Purpose
Platform for following founders from week one. Founders publish ventures, make public promises, and post short videos. Users discover and follow ventures.

Tagline: **"The overnight success, filmed daily."**

## Tech Stack (Current)
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS 4
- **Supabase** (Postgres + Auth)
- Mux for video
- Deployed to Vercel

## Deployment
- **Platform**: Vercel
- **Production URL**: https://vibed-hazel.vercel.app
- **Vercel Project**: jaysmit/vibed
- **GitHub Repo**: https://github.com/jaysmit/vibed
- **Supabase Project**: hhhhqgmmnhmxuzavdcqt

---

## Development Workflow

### Key Principle: Deploy Early, Deploy Often
Don't let changes pile up locally. Deploy to Vercel frequently to catch build/runtime issues early.

### Deployment Steps (DO THIS EVERY TIME)
```bash
cd "C:\Users\jake_\Documents\Web apps\Vibed"
npm run typecheck                # Fast - catches TS errors
vercel deploy --prod --yes       # Deploy immediately after typecheck passes
```

**DO NOT run `npm run build` locally** - it's slow and often hangs on Windows. Vercel builds faster and more reliably.

---

## Environment Variables

### Required in Vercel Dashboard
```
NEXT_PUBLIC_SUPABASE_URL=https://hhhhqgmmnhmxuzavdcqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
MUX_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=https://vibed-hazel.vercel.app
```

---

## Database Schema (Supabase)

### Tables
- **founders** - user_id, name, slug, bio, location, links, avatar_key
- **ventures** - slug, founder_id, name, pitch, industry, brand, glyph, rung, status, segments, promise, counters, country, categories
- **venture_members** - venture_id, founder_id, role, status, is_master, invitation_token
- **clips** - venture_id, segment_key, mux_asset_id, playback_id, transcript, counters
- **follows** - user_id, venture_id
- **events** - type, actor_id, venture_id, meta, created_at

---

## Current Features (2026-09-01)

### Authentication
- Email/password signup and login (Supabase Auth)
- Session management via cookies
- Protected routes redirect to login

### Public Pages
- **/** - Landing with content pillars (Trending Pitches, Distribution Playbooks, First Dollar Stories, Real Challenges, Building Right Now, Trending Ventures, All Time Favourites)
- **/discover** - Filter by industry, stage, video content type, sort by trending/popular
- **/v/[slug]** - Venture profile with tabs (Journey, Clips, Promises, Updates), Stats Bar, Elevator Pitch section
- **/login** - Email/password login
- **/register** - Email/password signup with name/location fields

### Protected Pages
- **/start** - Create new venture (4-step wizard: name, team, country, categories)
- **/dashboard** - Manage ventures
- **/v/[slug]/edit** - Edit venture details, segments with date picker, videos
- **/following** - Followed ventures
- **/profile** - Edit founder profile
- **/invite/[token]** - Accept team invitation

### Cards
- **PitchCard** - Instagram-style square cards for trending pitches (play icon overlay, likes, category, stage, founder with team dropdown, followers count)
- **VentureCard** - Full cards with more info (promise progress, followers, glyph)

### Journey/Timeline System
- **Flexible timeline**: Each segment has a "When did this happen?" date picker
- **Retroactive documentation**: Established businesses can set past dates to tell their story
- **Chronological display**: Journey accordion shows segments ordered by happenedAt date
- **16 predefined segments**: pitch, spark, validation, audience, proto, build, beta, gtm, launch, first, channel, trouble, money, team, scale, next

### Team System
- Invite team members by email or search existing users
- Roles: founder, partner, team_member
- Master user (venture creator) has full control
- Invitation tokens with accept/decline flow

### Owner Controls (when viewing own venture)
- Progress ring showing completion percentage
- Publish button (activates at 100% completion)
- Settings dropdown (Team, Edit URL, Visibility, Close, Delete)
- Inline edit icons on hover (pending full implementation)

---

## UI Components

### Core Components (`components/ui/`)
- VentureLogo, RungTag, PromiseClock, Avatar
- VentureCard, PitchCard
- VideoPlayer, VideoUploader
- JourneyAccordion (with happenedAt dates)
- TimelineProgress
- OwnerSettings, VentureCompletionControls
- ProgressRing
- CountrySelector, CategorySelector

---

## Commands
```bash
npm run dev        # Start dev server (Turbopack)
npm run typecheck  # Run TypeScript checks (use this before deploy)
npm run lint       # Run ESLint
```

---

## Session Log

- **2026-08-26**: Initial setup. Deployed to Vercel. Built data layer with MongoDB.
- **2026-08-27**: Built auth, follow system, founder editor, video uploads (Mux).
- **2026-08-28**: Migrated from MongoDB to Supabase. Built email/password auth. Redesigned header. Renamed "Journey" to "Venture". Built Discover page. Redesigned venture profile.
- **2026-09-01**: Major redesign session:
  - Added Instagram-style PitchCard with square video thumbnails, play overlay, likes, team dropdown
  - Added content pillars to landing page (Distribution Playbooks, First Dollar Stories, Real Challenges, Building Right Now)
  - Added Stats Bar to venture page (week, followers, clips, industry, location, streak, founder)
  - Added Promises tab with timeline and rewards
  - Redesigned Discover page with video content category filters
  - Implemented flexible timeline system with happenedAt dates for retroactive documentation
  - Added date picker to segment editor ("When did this happen?")
  - Journey accordion now shows timeline dates prominently

---

## Next Steps
- Complete inline editing on venture page
- Build actual follow functionality (backend)
- Build promise creation UI
- Add notifications for promise deadlines
- Build shorts export with watermark
