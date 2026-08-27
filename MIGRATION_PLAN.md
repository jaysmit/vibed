# Vibed: MongoDB → Supabase Migration Plan

## Overview

Migrating from MongoDB + Auth.js to Supabase (Postgres + Auth) to eliminate cold start issues and improve performance.

## Supabase Credentials

```
Project URL: https://hhhhqgmmnhmxuzavdcqt.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGhxZ21tbmhteHV6YXZkY3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MTIsImV4cCI6MjEwMzM5NzQxMn0.xQOq0Nib4VdE5XpuQ1b3bsPDsbhKVZ7wSQKu9_ZHMPM
Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGhxZ21tbmhteHV6YXZkY3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgyMTQxMiwiZXhwIjoyMTAzMzk3NDEyfQ.oU2j4oABYUh44JTHnbREWo4Jaq7QJF7XtO-6Ad4wWMo
```

---

## Phase 1: Database Schema

### SQL to run in Supabase SQL Editor:

```sql
-- Enable UUID extension (already enabled by default)

-- Founders table
create table public.founders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  bio text,
  location text,
  links jsonb default '{}',
  avatar_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ventures table
create table public.ventures (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references public.founders(id) on delete cascade not null,
  slug text unique not null,
  slug_history text[] default '{}',
  name text not null,
  pitch text not null,
  brand text not null,
  glyph text not null,
  rung text not null default 'idea',
  status text not null default 'draft',
  problem text,
  who text,
  why text,
  segments jsonb default '{}',
  links jsonb default '{}',
  counters jsonb default '{"followers":0,"clips":0,"photos":0,"likes":0,"comments":0,"weekNumber":1,"streakWeeks":0,"siteClicks30d":0,"trendingScore":0}',
  promise jsonb,
  promise_history jsonb[] default '{}',
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clips table
create table public.clips (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid references public.ventures(id) on delete cascade not null,
  founder_id uuid references public.founders(id) not null,
  question_slug text not null,
  title text not null,
  hook text,
  tagline text,
  mux_asset_id text,
  playback_id text,
  duration_sec integer not null default 0,
  thumb_time integer,
  transcript jsonb default '[]',
  transcript_status text default 'pending',
  segment_key text,
  counters jsonb default '{"views":0,"completes":0,"likes":0,"comments":0}',
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Follows table
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  venture_id uuid references public.ventures(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, venture_id)
);

-- Events table (analytics)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  venture_id uuid references public.ventures(id),
  clip_id uuid references public.clips(id),
  actor_id uuid,
  anon_id text,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_founders_user_id on public.founders(user_id);
create index idx_founders_slug on public.founders(slug);
create index idx_ventures_founder_id on public.ventures(founder_id);
create index idx_ventures_slug on public.ventures(slug);
create index idx_ventures_status_trending on public.ventures(status, (counters->>'trendingScore'));
create index idx_ventures_rung_published on public.ventures(rung, published_at);
create index idx_clips_venture_id on public.clips(venture_id);
create index idx_clips_question_slug on public.clips(question_slug, published_at);
create index idx_follows_user_id on public.follows(user_id);
create index idx_follows_venture_id on public.follows(venture_id);
create index idx_events_type_created on public.events(type, created_at);
create index idx_events_venture_id on public.events(venture_id);

-- Row Level Security (RLS)
alter table public.founders enable row level security;
alter table public.ventures enable row level security;
alter table public.clips enable row level security;
alter table public.follows enable row level security;
alter table public.events enable row level security;

-- RLS Policies

-- Founders: users can read all, but only update their own
create policy "Founders are viewable by everyone" on public.founders for select using (true);
create policy "Users can insert their own founder" on public.founders for insert with check (auth.uid() = user_id);
create policy "Users can update their own founder" on public.founders for update using (auth.uid() = user_id);

-- Ventures: published ventures readable by all, owners can edit
create policy "Published ventures are viewable by everyone" on public.ventures for select using (status = 'live' or deleted_at is null);
create policy "Founders can insert ventures" on public.ventures for insert with check (
  founder_id in (select id from public.founders where user_id = auth.uid())
);
create policy "Founders can update their ventures" on public.ventures for update using (
  founder_id in (select id from public.founders where user_id = auth.uid())
);

-- Clips: similar to ventures
create policy "Clips are viewable by everyone" on public.clips for select using (deleted_at is null);
create policy "Founders can manage clips" on public.clips for all using (
  founder_id in (select id from public.founders where user_id = auth.uid())
);

-- Follows: users manage their own follows
create policy "Follows are viewable by everyone" on public.follows for select using (true);
create policy "Users manage their own follows" on public.follows for all using (auth.uid() = user_id);

-- Events: insert only (analytics)
create policy "Anyone can insert events" on public.events for insert with check (true);
create policy "Events are viewable by everyone" on public.events for select using (true);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger founders_updated_at before update on public.founders for each row execute function update_updated_at();
create trigger ventures_updated_at before update on public.ventures for each row execute function update_updated_at();
create trigger clips_updated_at before update on public.clips for each row execute function update_updated_at();
```

---

## Phase 2: Install Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
npm uninstall mongoose @auth/mongodb-adapter next-auth
```

---

## Phase 3: New Files to Create

### `lib/supabase/client.ts`
Browser-side Supabase client for client components.

### `lib/supabase/server.ts`
Server-side Supabase client for Server Components and API routes.

### `lib/supabase/middleware.ts`
Middleware helper for refreshing auth tokens.

### `middleware.ts` (root)
Next.js middleware to handle auth session refresh.

---

## Phase 4: Files to Modify

### Services (lib/services/)
- `ventures.ts` - Replace Mongoose with Supabase queries
- `clips.ts` - Replace Mongoose with Supabase queries
- `follows.ts` - Replace Mongoose with Supabase queries
- `events.ts` - Replace Mongoose with Supabase queries

### API Routes
- Remove `app/api/auth/[...nextauth]` (Auth.js)
- Add `app/api/auth/callback/route.ts` (Supabase)
- Update all API routes to use Supabase client

### Pages
- Update login page to use Supabase Auth UI or custom form
- Update protected pages to check Supabase session

---

## Phase 5: Environment Variables

### Remove from .env.local:
```
MONGODB_URI
AUTH_SECRET
AUTH_RESEND_KEY
```

### Add to .env.local:
```
NEXT_PUBLIC_SUPABASE_URL=https://hhhhqgmmnhmxuzavdcqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update Vercel env vars:
Same as above, remove old MongoDB/Auth vars, add Supabase vars.

---

## Phase 6: Delete Old Files

After migration is complete and tested:
- `lib/db/` (entire folder)
- `lib/auth/` (entire folder)
- `app/api/auth/[...nextauth]/`
- `app/api/auth/dev-login/`

---

## Rollback Plan

If something goes wrong:
1. Revert git commits
2. Restore old env vars in Vercel
3. MongoDB data is unchanged (we're not deleting it)

---

## Estimated Effort

- Phase 1 (Schema): 10 minutes
- Phase 2 (Packages): 5 minutes
- Phase 3 (New files): 30 minutes
- Phase 4 (Modify files): 1-2 hours
- Phase 5 (Env vars): 10 minutes
- Phase 6 (Cleanup): 5 minutes
- Testing: 30 minutes

**Total: 2-3 hours**

---

## Ready to Execute?

Reply "yes" to start the migration, or ask questions about any part of the plan.
