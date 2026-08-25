# CLAUDE.md — Vibed

Read this before writing any code. Referenced files live in `/reference`.

## What this is

A place to follow founders from week one. Founders publish a journey in fixed segments, make public promises with dates, and post short videos (under a minute) answering a fixed set of sixteen questions. Readers follow, learn, and back them early.

Tagline: **The overnight success, filmed daily.**

Not: a launch directory, a revenue leaderboard, or a social network. There is deliberately **no public revenue metric** — first sale is a milestone on the timeline, never a number on a card.

## Reference material

- `/reference/vibed-mvp.html` — a working single-file prototype of every screen. **This is the design spec.** Match its layout, spacing, copy tone and interaction. Do not redesign.
- `/reference/vibed-architecture.md` — data model, event taxonomy, security requirements, phasing. **This is the technical spec.**

When the two disagree, ask rather than guessing.

## Stack

Next.js (App Router, TypeScript) · MongoDB Atlas via Mongoose · Auth.js · Mux for video · Resend for email · Railway for hosting (`web` + `worker` services) · Redis from Phase 2 only.

## Architecture rules — do not break these

1. **Components never query.** They take plain objects as props. A component that fetches turns the feed into N+1.
2. **Routes never touch models.** `page.tsx` → `lib/services` → `lib/db/repos` → `lib/db/models`.
3. **`lib/domain` imports nothing.** Rung logic, standards checks, segment ordering and scoring are pure functions with unit tests.
4. **Counters are denormalised** onto `ventures.counters` and written by services. Never count across collections in a page query.
5. **Every meaningful action writes to the `events` collection.** Even when nothing reads it yet — see the taxonomy in the architecture doc. This is non-negotiable; trending rules get written later against this history.

## Security musts

- Strip `$`-prefixed and dot-containing keys from any user input before it reaches a Mongo query.
- Re-check ownership server-side on every mutation, from the session, against the document. Never trust an id in a request body.
- Draft/unpublished ventures return 404, not 403.
- Video uploads go client → Mux via signed URL. The server never handles bytes. Verify Mux webhook signatures.
- Re-encode images server-side with Sharp and strip EXIF (GPS leaks location).
- Zod at every boundary, schemas shared between client and server.
- Nothing secret behind `NEXT_PUBLIC_`.

## SEO requirements (these drive real decisions)

- Transcripts must be in server-rendered HTML, never fetched client-side.
- `noindex` any venture that has not met standards. Thin pages drag down the whole domain.
- `VideoObject` schema on every clip, with transcript and uploadDate.
- Question pages (`/q/[slug]`) are canonical for clips. They are the pages meant to rank.
- Real paths, not hash routes. The prototype uses hash routing only because it is one file.

## Design tokens (from the prototype)

```css
--page:#FFFFFF; --bg:#F4F4F1; --soft:#F8F8F6;
--ink:#0E0E0E; --ink-2:#565656; --ink-3:#8A8A8A;
--rule:#E4E4E1; --rule-2:#CFCFCB;
--go:#05CE78; --go-deep:#017A4C; --go-tint:#E6F9F0;   /* progress, money, CTAs */
--heat:#5A2EC4; --heat-tint:#EEE9FB;                   /* trending */
--warn:#B7791F; --warn-tint:#FBF1DE;                   /* promise at risk */
--dead:#B03A28; --dead-tint:#FBEAE6;                   /* closed */
```

Fonts: **Fraunces** (display, `SOFT 60 / WONK 1`), **Inter** (body), **IBM Plex Mono** (all numbers, tabular).
Cards: white, 14px radius, 1px `--rule` border, `0 1px 3px rgba(0,0,0,.045)`, lift 5px on hover.
Container: 1180px. Breakpoints: 1000px and 680px.
Respect `prefers-reduced-motion` everywhere.

## Voice

Plain English, Australian spelling. Short sentences. Never "leverage", "empower", "journey" as a verb, or startup jargon. Copy in the prototype is the reference — match its register, including the dry humour in empty states.

## Conventions

- ULIDs for public ids. Never expose Mongo ObjectIds in URLs.
- Slugs are permanent: keep `slugHistory[]` and 301 from old ones.
- Soft delete only (`deletedAt`), never hard delete.
- All timestamps UTC, on every document.
- Server Components by default; `'use client'` only where interaction demands it.

## How I want you to work

- **Plan before writing.** For anything beyond a single file, outline the change and wait for confirmation.
- **One vertical slice at a time**, per `BUILD-PLAN.md`. Do not scaffold the whole app in one pass.
- **Commit per slice** with a clear message so work can be rolled back.
- **Run `npm run typecheck` and `npm run lint` before saying you are done.** Fix what they report.
- If a requirement here conflicts with what I have asked for in chat, say so rather than silently picking one.
