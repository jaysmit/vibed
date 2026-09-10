import { createAdminClient, createCachedAdminClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import type { Rung } from '@/lib/domain/rungs';
import type { Industry } from '@/lib/supabase/types';

export interface VentureWithFounder {
  _id: string;
  id: string;
  slug: string;
  slug_history: string[];
  founder_id: string;
  name: string;
  pitch: string;
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
  const supabase = createCachedAdminClient();

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => mapVenture(v, v.founders as Record<string, unknown>));
}

// Cached version - revalidates every 60 seconds
export const getPublishedVentures = unstable_cache(
  _getPublishedVentures,
  ['published-ventures'],
  { revalidate: 60, tags: ['ventures'] }
);

// Fast query for landing page - only fetches top N by followers (trending)
async function _getTrendingVentures(limit: number = 8): Promise<VentureWithFounder[]> {
  const supabase = createCachedAdminClient();

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('counters->followers', { ascending: false })
    .limit(limit);

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => mapVenture(v, v.founders as Record<string, unknown>));
}

export const getTrendingVentures = unstable_cache(
  _getTrendingVentures,
  ['trending-ventures'],
  { revalidate: 60, tags: ['ventures'] }
);

// Fast query for recent ventures
async function _getRecentVentures(limit: number = 8): Promise<VentureWithFounder[]> {
  const supabase = createCachedAdminClient();

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .in('status', ['live', 'graduated', 'closed'])
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((v) => mapVenture(v, v.founders as Record<string, unknown>));
}

export const getRecentVentures = unstable_cache(
  _getRecentVentures,
  ['recent-ventures'],
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
  const supabase = createCachedAdminClient();

  // Try by slug first
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single();

  // If not found, try slug_history
  if (!venture) {
    const { data: ventureByHistory } = await supabase
      .from('ventures')
      .select('*, founders(*)')
      .contains('slug_history', [slug])
      .is('deleted_at', null)
      .single();

    if (ventureByHistory) {
      // Redirect to current slug
      return {
        ...mapVenture(ventureByHistory, ventureByHistory.founders as Record<string, unknown>),
        _redirect: ventureByHistory.slug,
      };
    }
    return null;
  }

  return mapVenture(venture, venture.founders as Record<string, unknown>);
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
  const supabase = createCachedAdminClient();

  try {
    // Get team members for this venture
    const { data: members } = await supabase
      .from('venture_members')
      .select('*, founders(*)')
      .eq('venture_id', ventureId)
      .in('status', ['accepted', 'pending'])
      .order('is_master', { ascending: false })
      .order('created_at', { ascending: true });

    if (!members || members.length === 0) return [];

    return members.map((m) => {
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
  } catch {
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
