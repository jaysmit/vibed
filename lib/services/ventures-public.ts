import { createAdminClient } from '@/lib/supabase/server';
import type { Rung } from '@/lib/domain/rungs';

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
    name: string;
    slug: string;
    location?: string;
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
      name: (founder?.name as string) || 'Unknown',
      slug: (founder?.slug as string) || '',
      location: founder?.location as string | undefined,
    },
  };
}

export async function getPublishedVentures(): Promise<VentureWithFounder[]> {
  const supabase = await createAdminClient();

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

export async function getVentureBySlug(slug: string): Promise<VentureWithFounder | null> {
  const supabase = await createAdminClient();

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

  // Draft ventures return null (404) for non-owners
  if (venture.status === 'draft') {
    return null;
  }

  return mapVenture(venture, venture.founders as Record<string, unknown>);
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
