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

## Current Features (2026-09-02)

### Authentication
- Email/password signup and login (Supabase Auth)
- Session management via cookies
- Protected routes redirect to login

### Public Pages
- **/** - Landing page with:
  - Hero with intro video for logged-out users (landscape, matches text height on desktop)
  - Content sections: Trending Elevator Pitches, Trending Maker Moments, Trending Growth Hacks, Trending Pivot Points, Trending Ventures
  - Mobile: horizontal scroll for sections, tagline + video only (no description)
  - Cards ~10% smaller on desktop, ~20% smaller on mobile
- **/discover** - Collapsible filter sections (Watch, Industry, Stage), sort by trending/popular
- **/v/[slug]** - Venture profile with tabs (Journey, Clips, Promises, Updates), Stats Bar, Elevator Pitch section, clips sort/filter
- **/login** - Email/password login
- **/register** - Email/password signup with name/location fields
- **/help** - Help Centre with searchable FAQs in 7 categories
- **/privacy** - Privacy policy
- **/terms** - Terms of service

### Protected Pages
- **/start** - Create new venture (4-step wizard: name, team, country, categories)
- **/dashboard** - Manage ventures
- **/v/[slug]/edit** - Edit venture details, segments with date picker, videos
- **/following** - Followed ventures
- **/profile** - Edit founder profile
- **/invite/[token]** - Accept team invitation

### Comments System
- Nested comments with reply threading
- Author display with avatar
- Delete own comments (soft delete)
- API: /api/clips/[id]/comments, /api/comments/[id]

### Feedback/Support System
- Floating feedback button (bottom-right corner)
- 3-step modal: Bug Report / Feature Request / General Feedback
- Screenshot attachment with base64 encoding
- Auto-captures browser info and page URL
- Email notification to team via Resend
- Database: feedback table with status workflow (new → reviewing → in_progress → resolved → closed)

### Cards
- **PitchCard** - Instagram-style square cards for trending pitches (play icon overlay, likes, category, stage, founder with team dropdown, followers count)
- **VentureCard** - Full cards with 16:9 aspect-video poster, expandable description (3 lines + "See more"), promise progress, followers

### Infinite Scroll
- **InfiniteScrollSection** - Client component with IntersectionObserver for auto-loading
- Horizontal scroll on ALL screen sizes with cursor-based pagination
- API: `/api/ventures/feed?pillar=trending|recent|the_idea|etc&cursor=X&limit=6`

### Journey/Timeline System
- **Flexible timeline**: Each segment has a "When did this happen?" date picker
- **Retroactive documentation**: Established businesses can set past dates to tell their story
- **Chronological display**: Journey accordion shows segments ordered by happenedAt date
- **19 predefined segments** grouped by stage:
  - **Idea**: spark, validation, naming (new)
  - **Building**: proto, audience, build, beta, gtm
  - **Live**: launch, firstuser (new)
  - **First Dollar**: first, channel
  - **Growing**: trouble, money, team, retention (new), whatbroke (renamed from scale)
  - **Now**: next, pivot (new), shutdown (new)
- **Elevator Pitch section**: 'pitch' segment pinned to header, not in timeline
- **Request this chapter**: Non-owners see NudgeButton on empty segments to encourage founders to write

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
- CommentSection (nested replies, author display)
- FeedbackWidget (floating button, 3-step modal, screenshots)
- EndorseButton, ReasonPicker
- FollowButton, DiscoverLink
- PromiseEditor
- Header (logo + search left, Discover centered, auth right)
- SearchBar

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
- **2026-09-02**: Comments, feedback system, UI improvements:
  - Comments system with nested replies (migration 004)
  - Feedback widget with screenshot support (migration 005)
  - Help Centre with searchable FAQs (7 categories)
  - Header reorganization (Profile button visible, Following moved to dropdown)
  - Discover page collapsible filter sections
  - Venture page clips sort/filter (Recent, Popular, Oldest + segment filter)
  - Founder card links to profile page
  - Email notification for feedback via Resend
- **2026-09-03**: Landing page redesign:
  - Header: logo + search left, Discover centered (bold), auth actions right
  - Renamed sections: Trending Elevator Pitches, Trending Maker Moments, Trending Growth Hacks, Trending Pivot Points
  - Added "Trending Ventures" section with VentureCards
  - Mobile: horizontal scroll for all sections (hidden scrollbar)
  - Cards smaller: ~10% desktop, ~20% mobile
  - Reduced section spacing throughout
  - Hero intro video for logged-out users (landscape, side-by-side on desktop)
  - Mobile hero: tagline + video only (no description)
- **2026-09-07**: Landing page infinite scroll & card updates:
  - Created `/api/ventures/feed` API with cursor-based pagination for pillars
  - Built `InfiniteScrollSection` component with IntersectionObserver for infinite horizontal scroll
  - Horizontal scroll now works on ALL screen sizes (desktop + mobile)
  - `VentureCard` updated: 16:9 aspect-video poster ratio, expandable description (3 lines + "See more")
  - Removed logo icons from VentureCard (no more VentureLogo on cards)
  - Created `ShareButton` component (copy link, Twitter/X, LinkedIn, Facebook, native share)
  - Updated `ClipsGrid` with modal for viewing clips with endorse/share buttons
  - Rewrote intro video scripts (`reference/intro-video-script.md`, `reference/intro-video-scenes.md`) structured around four pillars: Be curious, Be inspired, Be ready, Be next
- **2026-09-07 (PM)**: Trust-based engagement system:
  - Created `user_trust` table tracking days_active, comments_count, follows_count, tier
  - Four trust tiers: Newcomer (default) -> Member (1 day, 1 follow) -> Contributor (7 days, 5 comments, 3 follows) -> Champion (30 days, 20 comments, 10 follows)
  - `venture_likes` table - anyone can like ventures (universal)
  - `venture_endorsements` table - trust-gated (Contributor+), with reasons and weighted endorsements (Champion 2x)
  - `LikeButton` component with optimistic updates
  - `VentureEndorseButton` component with locked state for low tiers, reason picker dropdown
  - `TrustBadge` component showing Member/Contributor/Champion badges
  - Venture page now shows Like and Endorse buttons after Follow
  - Trust metrics increment when users follow or comment
- **2026-09-09**: Performance optimizations:
  - **Landing page ISR**: Added `revalidate = 60` and moved auth check to client-side `HeroSection` component, making landing page statically cached with 1-minute revalidation
  - **Cached admin client**: Created `createCachedAdminClient()` (cookieless) for use inside `unstable_cache()` functions
  - **Cached queries**: `getTrendingVentures`, `getRecentVentures`, `getVentureBySlug`, `getClipsByVenture`, `getVentureTeam` all use `unstable_cache` (30-60s)
  - **Middleware optimization**: Skip Supabase auth check for public paths entirely
  - **Parallel queries**: Venture page now runs clips, team, and follow status queries in parallel (not sequential)
  - **Fast auth check**: Created `getCurrentUserIdFast()` using `getSession()` (local JWT validation) instead of `getUser()` (network request to Supabase auth)
  - **VentureCard/PitchCard**: Fixed-height descriptions (4 lines / 2 lines) with consistent card heights
- **2026-09-10**: Major performance optimization session:
  - **Bundle size reduction: 519 KB → 217 KB (58% smaller)**:
    - Lazy-loaded VideoPlayer (Mux) via `VideoPlayerLazy.tsx` wrapper
    - Removed VideoPlayer/VideoUploader from barrel exports
    - Updated JourneyAccordion to use lazy VideoPlayer
    - Added `optimizePackageImports` for @supabase/supabase-js, lucide-react, date-fns
  - **Font optimization**:
    - Added `display: "swap"` to all fonts (text appears immediately)
    - Reduced Inter from 4 weights to 2 (400, 600)
    - Added fallback fonts (Georgia, system-ui, Consolas)
  - **Image optimization**:
    - Converted all `<img>` to `next/image` in PitchCard and VentureCard
    - Added AVIF format support (25-35% smaller than WebP)
    - Added `priority` prop to first 2 cards in InfiniteScrollSection (LCP optimization)
    - Added Mux thumbnail domain to remotePatterns
  - **Database indexes** (migration 008):
    - Added indexes for ventures (slug, status, founder_id, counters)
    - Added indexes for clips (venture_id, published_at, segment_key)
    - Added indexes for follows, founders, comments, events
  - **Lazy-loaded FeedbackWidget** - modal code only loads when clicked
  - **Browser-level prerendering**: Added Speculation Rules API for `/v/*`, `/discover`, `/founder/*`
  - **Loading skeleton**: Added loading.tsx for venture page
  - **FollowButton self-fetches**: Follow state now fetched client-side, not blocking server render
- **2026-09-13**: Image cropping for uploads:
  - Created `ImageCropper` component (`components/ui/ImageCropper.tsx`) with drag-to-reposition, zoom slider, and base64 output
  - Integrated into ProfileEditor for avatar uploads (1:1 square, 400px output)
  - Integrated into venture edit page for cover images (16:9 landscape, 1200px output)
  - Ensures all profile avatars are perfectly square (display as circles on cards)
  - Ensures all venture covers are consistent 16:9 ratio
- **2026-09-13 (PM)**: Venture photo gallery feature:
  - Added `gallery?: string[]` to `VentureLinks` type for storing additional images
  - Created `VentureGallery` component - displays main image with thumbnail strip below, click to open lightbox
  - Created `GalleryViewer` lightbox - full-screen modal with navigation arrows, thumbnail strip, keyboard (arrows/ESC) and swipe support
  - Created `GalleryEditor` component - drag-to-reorder grid, add/remove images, first image is main cover, max 10 images
  - Replaced single cover image in venture edit page with GalleryEditor
  - Replaced hero image section on venture page with VentureGallery
  - No database migration needed - uses existing JSONB `links` field
- **2026-09-13 (Evening)**: Journey steps restructure:
  - Expanded from 16 to 19 journey segments with new stages: Idea, Building, Live, First Dollar, Growing, Now
  - Added 5 new segments: naming, firstuser, retention, pivot, shutdown
  - Renamed 'scale' segment to 'whatbroke' (more descriptive)
  - Renamed 'alumni' stage to 'now' (clearer meaning)
  - Removed 'pitch' from timeline (already displayed in Elevator Pitch section)
  - Created `NudgeButton` component for non-owners to request specific chapters
  - Non-owners see "Request this chapter" button on empty segments instead of just "Not written yet"
  - Created `segment_nudges` table (migration 009) to track nudge requests
  - Created `/api/ventures/[id]/nudges/[segment]` API for nudge GET/POST
  - Updated all rung label maps across codebase (DiscoverFilters, RungLadder, TimelineProgress, PitchCard, etc.)
  - Created migration script `scripts/migrate-scale-to-whatbroke.js` for existing data
- **2026-09-13 (Night)**: Edit page team management, profile page fixes, gallery layout, landing cleanup:
  - **TeamEditor component**: Full team management on venture edit page - add existing users, invite new people, change roles, remove members
  - **VentureGallery layout update**: 1 image = full width, 2-3 images = main with +X green overlay, 4+ = grid layout. Clicking opens carousel (no longer links to website)
  - **Profile page mobile fix**: Avatar now 80px (was 48px), name text 22px on mobile (was 32px), centered vertical layout on mobile
  - **VentureCard 'use client' fix**: Added missing directive - components with onClick handlers MUST be client components
  - **VentureCard fixed height**: 180px card body with line-clamp-3 and "See more" indicator
  - **Avatar component**: Added '3xl' size (80px), increased 'profile' size to 80px
  - **Cleaned up dummy ventures**: Soft-deleted 20 seed/dummy ventures from database, only real user ventures remain
  - **Landing page sections**: Trending Ventures (real data), Trending Elevator Pitches (empty), pillar sections (empty with placeholders)
  - **Fixed infinite scroll duplicates**: Added deduplication by slug in InfiniteScrollSection, fixed trending pagination to use offset instead of broken JSONB cursor, limited initial fetch to 4 items
- **2026-10-18**: Landing page performance fix - page now loads in ~700ms:
  - **Problem**: Only "Trending Ventures" loaded instantly, other sections made client-side API calls
  - **First attempt**: 6 parallel queries with `Promise.all()` - caused 10s load times (cold start overhead)
  - **Second attempt**: Single query but IntersectionObserver fired 6 API calls during page navigation
  - **Final fix**:
    - Single `getLandingPageVentures()` query fetches all data in 1 DB call
    - Disabled IntersectionObserver auto-loading (was firing during navigation)
    - Manual "Load more" button only - predictable, no surprise API calls
    - Removed `/discover` from speculation rules prerender (was triggering extra loads)
  - Slim column selection excludes `segments` JSONB (avoids 31MB page size)
  - Created `docs/DATABASE-OPTIMIZATION-PATTERNS.md` documenting patterns

---

## Common Patterns & Gotchas

### Pagination Strategies
- **Cursor-based (preferred)**: Use `published_at` or other indexed timestamp field with `lt()` for older items
- **Offset-based (for JSONB)**: Use `range(offset, offset + limit - 1)` when sorting by JSONB fields like `counters->followers`
- **Always deduplicate**: In infinite scroll, track seen slugs with `Set` before appending new items

### Client vs Server Components
- Components with ANY event handlers (`onClick`, `onChange`, etc.) MUST have `'use client'`
- Server Components can render Client Components but not vice versa
- Error only shows in production - test with `vercel deploy --prod` not just localhost

### Image/Avatar Sizing
- Next.js Image needs BOTH `width/height` props AND inline `style={{ width, height }}`
- Add `minWidth` and `maxWidth` for stubborn cases
- Always use `flex-shrink-0` on fixed-size elements in flex containers

### Mobile Responsive
- Pattern: `flex-col sm:flex-row` for vertical mobile, horizontal desktop
- Text: `text-[small] sm:text-[large]` e.g., `text-[22px] sm:text-[32px]`
- Spacing: `gap-4 sm:gap-6`, `p-4 sm:p-6`
- Test mobile view after every UI change

---

## Next Steps
- Profile page editable (same as founder page but user can edit)
- Shorts export with watermark for social sharing
- In-app notifications (real-time notification system)
- Live chat support (future enhancement to feedback system)

## Pending Migrations
Run in Supabase SQL Editor:
- `supabase/migrations/004_comments.sql` - Comments table
- `supabase/migrations/005_feedback.sql` - Feedback table
