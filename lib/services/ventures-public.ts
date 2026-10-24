import { createClient, createAdminClient, createCachedAdminClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import type { Rung } from '@/lib/domain/rungs';
import type { Industry } from '@/lib/supabase/types';
import { Timer } from '@/lib/utils/timing';

export interface VentureWithFounder {
  _id: string;
  id: string;
  slug: string;
  slug_history: string[];
  founder_id: string;
  name: string;
  pitch: string;
  tagline?: string | null;
  brand: string;
  glyph: string;
  rung: Rung;
  industry: Industry;
  country?: string;
  categories?: Industry[];
  status: 'draft' | 'live' | 'graduated' | 'closed';
  links: Record<string, string | undefined>;
  problem?: string;
  who?: string;
  why?: string;
  segments: Record<string, { body?: string; publishedAt?: string; updatedAt?: string }>;
  promise?: { text: string; dueAt: Date; createdAt: Date } | null;
  promiseHistory: { text: string; dueAt: Date; resolvedAt: Date; kept: boolean; note?: string }[];
  counters: {
    followers: number;
    clips: number;
    photos: number;
    likes: number;
    endorsements: number;
    comments: number;
    weekNumber: number;
    streakWeeks: number;
    siteClicks30d: number;
    trendingScore: number;
  };
  standards?: { met: number; of: number; checkedAt?: Date };
  published_at?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  founder: {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    headline?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    links?: Record<string, string | undefined>;
  };
  _redirect?: string;
}

function mapVenture(v: Record<string, unknown>, founder: Record<string, unknown>): VentureWithFounder {
  // Map promise with proper Date conversion
  let promise: VentureWithFounder['promise'] = null;
  if (v.promise && typeof v.promise === 'object') {
    const p = v.promise as Record<string, unknown>;
    if (p.text && p.dueAt && p.createdAt) {
      promise = {
        text: p.text as string,
        dueAt: new Date(p.dueAt as string),
        createdAt: new Date(p.createdAt as string),
      };
    }
  }

  // Map promiseHistory with proper Date conversion
  const promiseHistory: VentureWithFounder['promiseHistory'] = [];
  if (Array.isArray(v.promise_history)) {
    for (const ph of v.promise_history as Record<string, unknown>[]) {
      promiseHistory.push({
        text: ph.text as string,
        dueAt: new Date(ph.dueAt as string),
        resolvedAt: new Date(ph.resolvedAt as string),
        kept: ph.kept as boolean,
        note: ph.note as string | undefined,
      });
    }
  }

  return {
    _id: v.id as string,
    id: v.id as string,
    slug: v.slug as string,
    slug_history: (v.slug_history as string[]) || [],
    founder_id: v.founder_id as string,
    name: v.name as string,
    pitch: v.pitch as string,
    tagline: v.tagline as string | null | undefined,
    brand: v.brand as string,
    glyph: v.glyph as string,
    rung: v.rung as Rung,
    industry: (v.industry as Industry) || 'other',
    country: v.country as string | undefined,
    categories: (v.categories as Industry[]) || [],
    status: v.status as 'draft' | 'live' | 'graduated' | 'closed',
    links: (v.links as Record<string, string | undefined>) || {},
    problem: v.problem as string | undefined,
    who: v.who as string | undefined,
    why: v.why as string | undefined,
    segments: (v.segments as Record<string, { body?: string }>) || {},
    promise,
    promiseHistory,
    counters: v.counters as VentureWithFounder['counters'],
    standards: v.standards as VentureWithFounder['standards'],
    published_at: v.published_at as string | undefined,
    deleted_at: v.deleted_at as string | undefined,
    created_at: v.created_at as string,
    updated_at: v.updated_at as string,
    founder: {
      id: (founder?.id as string) || '',
      user_id: (founder?.user_id as string) || '',
      name: (founder?.name as string) || 'Unknown',
      slug: (founder?.slug as string) || '',
      headline: founder?.headline as string | undefined,
      bio: founder?.bio as string | undefined,
      location: founder?.location as string | undefined,
      avatar: (founder?.links as Record<string, string> | undefined)?.avatar,
      links: founder?.links as Record<string, string | undefined>,
    },
  };
}

// Internal function that actually fetches (uses cookieless client for caching)
async function _getPublishedVentures(): Promise<VentureWithFounder[]> {
  const timer = new Timer('getPublishedVentures');

  timer.step('createClient');
  const supabase = createCachedAdminClient();

  timer.step('query');
  // Fetch all columns but strip segments after to reduce serialization overhead
  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  timer.step('process');
  if (!ventures || ventures.length === 0) {
    timer.end();
    return [];
  }

  const result = ventures.map((v) => {
    const founder = Array.isArray(v.founders) ? v.founders[0] : v.founders;
    const mapped = mapVenture(v as Record<string, unknown>, founder as Record<string, unknown>);
    mapped.segments = {}; // Strip segments to reduce serialization overhead
    return mapped;
  });

  timer.end();
  return result;
}

// Cached version - revalidates every 60 seconds
export const getPublishedVentures = unstable_cache(
  _getPublishedVentures,
  ['published-ventures'],
  { revalidate: 60, tags: ['ventures'] }
);

// Slim columns for landing page cards (excludes segments which can be huge)
const LANDING_CARD_COLUMNS_TOP = `
  id, slug, slug_history, founder_id, name, pitch, tagline,
  brand, glyph, rung, industry, country, categories, status,
  links, counters, promise, promise_history, published_at,
  deleted_at, created_at, updated_at,
  founders(id, user_id, name, slug, headline, bio, location, links)
`;

// Pillar segment mapping (keep in sync with lib/supabase/types.ts)
const PILLAR_SEGMENTS: Record<string, string[]> = {
  the_idea: ['pitch', 'spark', 'validation'],
  building_it: ['proto', 'build', 'beta', 'audience'],
  getting_customers: ['gtm', 'launch', 'firstuser', 'channel', 'first', 'retention'],
  hard_parts: ['trouble', 'money', 'team', 'pivot', 'shutdown'],
};

// Landing page data structure
export interface LandingPageData {
  trending: VentureWithFounder[];
  recent: VentureWithFounder[];
  the_idea: VentureWithFounder[];
  building_it: VentureWithFounder[];
  getting_customers: VentureWithFounder[];
  hard_parts: VentureWithFounder[];
}

// SINGLE query for ALL landing page sections - avoids 6 separate DB calls
async function _getLandingPageVentures(limitPerSection: number = 4): Promise<LandingPageData> {
  const timer = new Timer('getLandingPageVentures');

  timer.step('createClient');
  // Use regular client (works with both anon and auth contexts)
  const supabase = await createClient();

  timer.step('query');
  // Fetch enough ventures for all sections in ONE query
  // Need segments for pillar filtering, but strip them from response
  const { data: ventures, error } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(50); // Enough for all sections

  timer.step('process');

  // Log error if any (will appear in Vercel logs)
  if (error) {
    console.error('Landing page ventures error:', error);
  }

  if (!ventures || ventures.length === 0) {
    return { trending: [], recent: [], the_idea: [], building_it: [], getting_customers: [], hard_parts: [] };
  }

  // Helper to map venture and strip segments
  const mapAndStrip = (v: typeof ventures[0]): VentureWithFounder => {
    const founder = Array.isArray(v.founders) ? v.founders[0] : v.founders;
    const mapped = mapVenture(v as Record<string, unknown>, founder as Record<string, unknown>);
    mapped.segments = {}; // Strip segments from response
    return mapped;
  };

  // Sort by followers for trending (already have the data, just need to sort)
  const byFollowers = [...ventures].sort((a, b) => {
    const aFollowers = (a.counters as Record<string, number>)?.followers || 0;
    const bFollowers = (b.counters as Record<string, number>)?.followers || 0;
    return bFollowers - aFollowers;
  });

  // Recent is already sorted by published_at (from query)
  const recent = ventures.slice(0, limitPerSection).map(mapAndStrip);
  const trending = byFollowers.slice(0, limitPerSection).map(mapAndStrip);

  // Filter ventures for each pillar
  const filterByPillar = (pillar: string): VentureWithFounder[] => {
    const pillarSegments = PILLAR_SEGMENTS[pillar];
    if (!pillarSegments) return [];

    const filtered = ventures.filter((v) => {
      const segments = v.segments as Record<string, { body?: string }> | null;
      if (!segments) return false;
      return pillarSegments.some((key) => {
        const segment = segments[key];
        return segment && segment.body && segment.body.trim().length > 0;
      });
    });

    return filtered.slice(0, limitPerSection).map(mapAndStrip);
  };

  timer.end();

  return {
    trending,
    recent,
    the_idea: filterByPillar('the_idea'),
    building_it: filterByPillar('building_it'),
    getting_customers: filterByPillar('getting_customers'),
    hard_parts: filterByPillar('hard_parts'),
  };
}

// Direct call - no unstable_cache since page is force-dynamic anyway
// This avoids stale cache issues from build-time or failed requests
export async function getLandingPageVentures(limit: number = 4): Promise<LandingPageData> {
  return _getLandingPageVentures(limit);
}

// Direct call for trending ventures - no caching to avoid stale data
export async function getTrendingVentures(limit: number = 8): Promise<VentureWithFounder[]> {
  const timer = new Timer('getTrendingVentures');

  timer.step('createClient');
  const supabase = await createClient();

  timer.step('query');
  // Fetch all columns but strip segments after to reduce serialization overhead
  const { data: ventures, error } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('counters->followers', { ascending: false })
    .limit(limit);

  timer.step('process');
  if (error) {
    console.error('getTrendingVentures error:', error);
    timer.end();
    return [];
  }

  if (!ventures || ventures.length === 0) {
    timer.end();
    return [];
  }

  const result = ventures.map((v) => {
    const founder = Array.isArray(v.founders) ? v.founders[0] : v.founders;
    const mapped = mapVenture(v as Record<string, unknown>, founder as Record<string, unknown>);
    mapped.segments = {}; // Strip segments to reduce serialization overhead
    return mapped;
  });

  timer.end();
  return result;
}

// Keeping this for reference but not using it
const _getTrendingVenturesCached = unstable_cache(
  async (limit: number = 8) => getTrendingVentures(limit),
  ['trending-ventures'],
  { revalidate: 60, tags: ['ventures'] }
);

async function _getRecentVentures(limit: number = 8): Promise<VentureWithFounder[]> {
  const supabase = createCachedAdminClient();

  const { data: ventures } = await supabase
    .from('ventures')
    .select(LANDING_CARD_COLUMNS_TOP)
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => {
    const founder = Array.isArray(v.founders) ? v.founders[0] : v.founders;
    const mapped = mapVenture(v as Record<string, unknown>, founder as Record<string, unknown>);
    mapped.segments = {};
    return mapped;
  });
}

export const getRecentVentures = unstable_cache(
  _getRecentVentures,
  ['recent-ventures'],
  { revalidate: 60, tags: ['ventures'] }
);

async function _getVenturesByPillar(pillar: string, limit: number = 8): Promise<VentureWithFounder[]> {
  const supabase = createCachedAdminClient();
  const pillarSegments = PILLAR_SEGMENTS[pillar];

  if (!pillarSegments) return [];

  const { data: ventures } = await supabase
    .from('ventures')
    .select(`${LANDING_CARD_COLUMNS_TOP}, segments`)
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit * 3);

  if (!ventures || ventures.length === 0) return [];

  const filtered = ventures.filter((v) => {
    const segments = v.segments as Record<string, { body?: string }> | null;
    if (!segments) return false;
    return pillarSegments.some((key) => {
      const segment = segments[key];
      return segment && segment.body && segment.body.trim().length > 0;
    });
  });

  return filtered.slice(0, limit).map((v) => {
    const founder = Array.isArray(v.founders) ? v.founders[0] : v.founders;
    const mapped = mapVenture(v as Record<string, unknown>, founder as Record<string, unknown>);
    mapped.segments = {};
    return mapped;
  });
}

export const getVenturesByPillar = unstable_cache(
  _getVenturesByPillar,
  ['ventures-by-pillar'],
  { revalidate: 60, tags: ['ventures'] }
);

export async function getVenturesByRung(rung: Rung): Promise<VentureWithFounder[]> {
  const supabase = await createAdminClient();

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('rung', rung)
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => mapVenture(v, v.founders as Record<string, unknown>));
}

// Internal function for fetching venture by slug (uses cookieless client for caching)
async function _getVentureBySlugInternal(slug: string): Promise<VentureWithFounder | null> {
  const timer = new Timer(`getVentureBySlug(${slug})`);

  timer.step('createClient');
  const supabase = createCachedAdminClient();

  timer.step('queryBySlug');
  // Try by slug first
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  // If not found, try slug_history
  if (!venture) {
    timer.step('queryByHistory');
    const { data: ventureByHistory } = await supabase
      .from('ventures')
      .select('*, founders(*)')
      .contains('slug_history', [slug])
      .is('deleted_at', null)
      .single();

    if (ventureByHistory) {
      timer.step('mapVenture');
      const result = {
        ...mapVenture(ventureByHistory, ventureByHistory.founders as Record<string, unknown>),
        _redirect: ventureByHistory.slug,
      };
      timer.end();
      return result;
    }
    timer.end();
    return null;
  }

  timer.step('mapVenture');
  const result = mapVenture(venture, venture.founders as Record<string, unknown>);
  timer.end();
  return result;
}

// Cached venture fetch - revalidates every 30 seconds
const getCachedVentureBySlug = unstable_cache(
  _getVentureBySlugInternal,
  ['venture-by-slug'],
  { revalidate: 30, tags: ['ventures'] }
);

// Public function with owner/draft check (can't cache this part since it depends on viewer)
export async function getVentureBySlug(slug: string, viewerUserId?: string | null): Promise<VentureWithFounder | null> {
  const venture = await getCachedVentureBySlug(slug);

  if (!venture) return null;

  const isOwner = viewerUserId && venture.founder?.user_id === viewerUserId;

  // Draft ventures return null (404) for non-owners
  if (venture.status === 'draft' && !isOwner) {
    return null;
  }

  return venture;
}

export async function getFeaturedVenture(): Promise<VentureWithFounder | null> {
  const supabase = await createAdminClient();

  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('status', 'live')
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .limit(1)
    .single();

  if (!venture) return null;

  return mapVenture(venture, venture.founders as Record<string, unknown>);
}

export async function getClosedVentures(): Promise<VentureWithFounder[]> {
  const supabase = await createAdminClient();

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('status', 'closed')
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => mapVenture(v, v.founders as Record<string, unknown>));
}

export async function getGraduatedVentures(): Promise<VentureWithFounder[]> {
  const supabase = await createAdminClient();

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('status', 'graduated')
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => mapVenture(v, v.founders as Record<string, unknown>));
}

export async function getVenturesByIds(ids: string[]): Promise<VentureWithFounder[]> {
  const supabase = await createAdminClient();

  if (ids.length === 0) return [];

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .in('id', ids)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => mapVenture(v, v.founders as Record<string, unknown>));
}

// Team member with founder profile data
export interface TeamMemberWithProfile {
  id: string;
  role: 'founder' | 'partner' | 'team_member';
  founder: {
    id: string;
    name: string;
    slug: string;
    headline?: string;
    bio?: string;
    location?: string;
    avatar?: string;
    links?: Record<string, string | undefined>;
  } | null;
  // For invited members who haven't joined yet
  first_name?: string;
  last_name?: string;
  status: string;
}

async function _getVentureTeam(ventureId: string): Promise<TeamMemberWithProfile[]> {
  const timer = new Timer(`getVentureTeam(${ventureId.slice(0, 8)})`);

  timer.step('createClient');
  const supabase = createCachedAdminClient();

  try {
    timer.step('query');
    // Get team members for this venture
    const { data: members } = await supabase
      .from('venture_members')
      .select('*, founders(*)')
      .eq('venture_id', ventureId)
      .in('status', ['accepted', 'pending'])
      .order('is_master', { ascending: false })
      .order('created_at', { ascending: true });

    if (!members || members.length === 0) {
      timer.end();
      return [];
    }

    timer.step('mapMembers');
    const result = members.map((m) => {
      const founder = m.founders as Record<string, unknown> | null;
      return {
        id: m.id,
        role: m.role,
        first_name: m.first_name,
        last_name: m.last_name,
        status: m.status,
        founder: founder ? {
          id: founder.id as string,
          name: founder.name as string,
          slug: founder.slug as string,
          headline: founder.headline as string | undefined,
          bio: founder.bio as string | undefined,
          location: founder.location as string | undefined,
          avatar: (founder.links as Record<string, string> | undefined)?.avatar,
          links: founder.links as Record<string, string | undefined>,
        } : null,
      };
    });

    timer.end();
    return result;
  } catch {
    timer.end();
    // Table might not exist yet
    return [];
  }
}

// Cached - revalidates every 60 seconds
export const getVentureTeam = unstable_cache(
  _getVentureTeam,
  ['venture-team'],
  { revalidate: 60, tags: ['team'] }
);
