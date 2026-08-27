# Vibed - Project Notes

## Purpose
Main showcase website for following founders from week one. Founders publish journeys, make public promises, and post short videos answering fixed questions.

Tagline: **"The overnight success, filmed daily."**

## Tech Stack (Current)
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS 4
- MongoDB Atlas via Mongoose
- Deployed to Vercel (considering Railway for worker service)

## Tech Stack (Planned - Phase 1+)
- Auth.js for authentication
- Mux for video
- Resend for email
- Redis (Phase 2)

See `CLAUDE.md` in Vibed folder for full architecture spec.

## Project Structure
```
/app
  /(public)
    page.tsx                    # landing with ventures grid
    /v/[slug]/page.tsx          # venture profile with segments
    /q/[slug]/page.tsx          # question page with clips
    /answers/page.tsx           # all 16 questions index
    /rung/[key]/page.tsx        # filter by journey stage
    /postmortems/page.tsx       # closed ventures
    /login/page.tsx             # magic link login
    /login/check-email/page.tsx # email sent confirmation
    /login/error/page.tsx       # auth error page
  /(app)
    /following/page.tsx         # followed ventures (protected)
  /api
    /auth/[...nextauth]/route.ts # Auth.js routes
    /follow/route.ts            # follow/unfollow API
    /health/route.ts            # health check endpoint
    /track/route.ts             # event tracking endpoint
  layout.tsx                    # root layout with fonts + SessionProvider

/components
  /providers
    SessionProvider.tsx         # next-auth session wrapper
  /ui
    Avatar.tsx                  # initials avatar
    FollowButton.tsx            # follow/unfollow button
    Header.tsx                  # nav with search, rung tabs
    PromiseClock.tsx            # promise countdown + history
    RungLadder.tsx              # progress bar visualization
    VentureCard.tsx             # card with promise, stats
    VentureLogo.tsx             # SVG glyph icons
    index.ts                    # barrel export

/lib
  /auth
    config.ts                   # Auth.js configuration
    mongodb-adapter.ts          # MongoDB client for adapter
    index.ts                    # exports auth, signIn, signOut
  /db
    connect.ts                  # cached Mongo connection
    /models
      user.ts                   # email, name, handle, role
      founder.ts                # userId, name, slug, bio, links
      venture.ts                # the hub document (segments, promise, counters)
      clip.ts                   # video clips with transcript
      follow.ts                 # user follows
      event.ts                  # full event taxonomy
      index.ts                  # barrel export
    /repos
      ventures.ts               # query functions for ventures
      founders.ts               # query functions for founders
      clips.ts                  # query functions for clips
      follows.ts                # query functions for follows
      index.ts                  # barrel export
  /services
    events.ts                   # event logging service
    follows.ts                  # follow/unfollow with counters
    index.ts                    # barrel export
  /domain
    questions.ts                # 16 fixed questions definition
  /validation
    schemas.ts                  # Zod schemas (slug, email, ulid)

/types
  next-auth.d.ts                # session type augmentation

/reference
  vibed-mvp.html                # original HTML prototype (design spec)

/scripts
  seed.ts                       # seeds 7 ventures from MVP
```

## Deployment
- **Platform**: Vercel (works with Next.js + external services)
- **Production URL**: https://vibed-hazel.vercel.app
- **Vercel Project**: jaysmit/vibed
- **GitHub Repo**: https://github.com/jaysmit/vibed
- **Auto-deploy**: Enabled (push to main triggers deploy)

## Environment Variables Required
- `MONGODB_URI` - MongoDB Atlas connection string (REQUIRED for app to work)
- `AUTH_SECRET` - Auth.js secret (run `npx auth secret` to generate)
- `AUTH_RESEND_KEY` - Resend API key for magic link emails
- `EMAIL_FROM` - From address for emails (default: "Vibed <noreply@vibed.com>")

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run seed` - Seed database with 7 ventures

---

## Current Status (2026-08-27)

### Completed Slices
- [x] **Slice 0 - Scaffold**: Next.js 15, TypeScript, Tailwind 4, ESLint, Prettier, design tokens, folder structure
- [x] **Slice 1 - Data Layer**: Mongoose models with indexes, cached connection, seed script
- [x] **Slice 2 - Public Read Paths**: Landing, venture profile, question pages, answers, rung filter, postmortems
- [x] **Slice 3 - Events**: Event service, /api/track endpoint, impression tracking on landing page
- [x] **Slice 4 - Auth + Follow**: Auth.js with Resend magic link, /login pages, /following page, follow service with counter updates

### Blockers Before Testing
1. **MongoDB Atlas not set up** - Need to create cluster and get connection string
2. **No `.env.local`** - Need to add `MONGODB_URI` environment variable
3. **Resend API key needed** - Add `AUTH_RESEND_KEY` for magic link emails
4. **Auth secret needed** - Add `AUTH_SECRET` (run `npx auth secret` to generate)

### What Works Without MongoDB
- Dev server runs (`npm run dev`)
- TypeScript compiles (`npm run typecheck`)
- ESLint passes (`npm run lint`)
- Pages render (will show "No ventures" empty states)

---

## Next Session - Slice 5: Founder Editor

### What to Build
1. `/start` page for new founders to begin their journey
2. `/dashboard` for founders to manage their venture
3. `/v/[slug]/edit` for editing venture details and segments

### Files to Create
```
app/(app)/start/page.tsx        # Start journey wizard
app/(app)/dashboard/page.tsx    # Founder dashboard
app/(app)/v/[slug]/edit/page.tsx # Edit venture
lib/services/ventures.ts        # Venture CRUD operations
```

### Done When
Can create a venture, edit segments, and publish.

---

## Future Slices

| Slice | What | Key Files |
|-------|------|-----------|
| 5 | Founder Editor | `/start`, `/dashboard`, `/v/[slug]/edit` |
| 6 | Video | Mux upload, webhook, transcript, player |
| 7 | Email | Resend, weekly digest, founder nudge |
| 8 | Trending | Worker, scoring aggregation |

---

## Session Log
- **2026-08-26**: Initial Vercel deploy. Connected GitHub for auto-deploy.
- **2026-08-26**: Converted to Next.js 15 + Tailwind 4. Built full data layer with 6 Mongoose models, indexes per architecture spec. Created seed script with 7 ventures from MVP.
- **2026-08-26**: Built all public read paths - landing page with venture grid, venture profile with segments/promise/sidebar, question pages, answers index, rung filter, postmortems. Created 6 UI components (Header, VentureCard, VentureLogo, RungLadder, PromiseClock, Avatar).
- **2026-08-27**: Built events tracking system - event service with rate limiting, /api/track endpoint (single + batch), TrackImpression component with IntersectionObserver, VentureRail component. Landing page now tracks rail impressions with position.
- **2026-08-27**: Built auth + follow system - Auth.js v5 with Resend magic link provider, MongoDB adapter, /login with check-email and error pages, /following protected page, FollowButton component, /api/follow endpoint, follows service with counter denormalisation, follows repo.
