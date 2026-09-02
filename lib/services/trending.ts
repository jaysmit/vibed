import { createAdminClient } from '@/lib/supabase/server';
import { PILLAR_SEGMENTS } from '@/lib/supabase/types';
import type { Pillar, ClipCounters } from '@/lib/supabase/types';

export interface ClipWithVenture {
  _id: string;
  venture_id: string;
  founder_id: string;
  question_slug: string;
  title: string;
  hook?: string;
  tagline?: string;
  playback_id?: string;
  durationSec: number;
  thumbTime?: number;
  segment_key?: string;
  counters: ClipCounters;
  published_at?: string;
  created_at: string;
  venture: {
    slug: string;
    name: string;
    brand: string;
    glyph: string;
  };
  founder: {
    name: string;
    slug: string;
    location?: string;
  };
}

/**
 * Scoring weights for trending calculation
 */
const WEIGHTS = {
  view: 1,
  endorsement: 3,
  endorsement_from_founder: 5,
  follow_after: 4,
  avg_watch_percent: 0.5,
  rewatch: 2,
  staff_pick_boost: 20,
};

/**
 * Time decay: score multiplied by 0.95^days_old
 * This reduces the score by ~5% per day
 */
const TIME_DECAY_FACTOR = 0.95;

/**
 * Calculate trending score for a single clip
 * Uses views, endorsements, founder endorsements, follows, watch time, rewatches
 * and staff picks with time decay
 */
export async function calculateTrendingScore(clipId: string): Promise<number> {
  const supabase = await createAdminClient();

  // Get clip with counters
  const { data: clip } = await supabase
    .from('clips')
    .select('id, counters, published_at, created_at')
    .eq('id', clipId)
    .single();

  if (!clip) return 0;

  const counters = clip.counters as ClipCounters;

  // Check if staff picked
  const { data: staffPick } = await supabase
    .from('staff_picks')
    .select('id')
    .eq('clip_id', clipId)
    .eq('active', true)
    .limit(1)
    .single();

  const isStaffPicked = !!staffPick;

  // Calculate raw score
  let score = 0;
  score += (counters.views || 0) * WEIGHTS.view;
  score += (counters.likes || 0) * WEIGHTS.endorsement;
  score += (counters.endorsements_from_founders || 0) * WEIGHTS.endorsement_from_founder;
  score += (counters.follows_after || 0) * WEIGHTS.follow_after;
  score += (counters.avg_watch_percent || 0) * WEIGHTS.avg_watch_percent;
  score += (counters.rewatches || 0) * WEIGHTS.rewatch;

  if (isStaffPicked) {
    score += WEIGHTS.staff_pick_boost;
  }

  // Apply time decay
  const publishedDate = clip.published_at ? new Date(clip.published_at) : new Date(clip.created_at);
  const daysOld = Math.max(0, (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  const decayMultiplier = Math.pow(TIME_DECAY_FACTOR, daysOld);

  return Math.round(score * decayMultiplier * 100) / 100;
}

/**
 * Update the trending score for a single clip and save to database
 */
export async function updateTrendingScore(clipId: string): Promise<number> {
  const supabase = await createAdminClient();

  const score = await calculateTrendingScore(clipId);

  // Get current counters and update with new score
  const { data: clip } = await supabase
    .from('clips')
    .select('counters')
    .eq('id', clipId)
    .single();

  if (clip) {
    const counters = clip.counters as Record<string, number>;
    await supabase
      .from('clips')
      .update({
        counters: {
          ...counters,
          trending_score: score,
        },
      })
      .eq('id', clipId);
  }

  return score;
}

/**
 * Recalculate trending scores for all published clips
 * Run as a batch job (e.g., daily via cron)
 */
export async function recalculateAllTrendingScores(): Promise<{ processed: number }> {
  const supabase = await createAdminClient();

  // Get all published clips
  const { data: clips } = await supabase
    .from('clips')
    .select('id')
    .not('published_at', 'is', null)
    .is('deleted_at', null);

  if (!clips || clips.length === 0) {
    return { processed: 0 };
  }

  // Process each clip
  let processed = 0;
  for (const clip of clips) {
    await updateTrendingScore(clip.id);
    processed++;
  }

  return { processed };
}

/**
 * Get top clips for a pillar, ordered by trending score
 */
export async function getTopClipsByPillar(
  pillar: Exclude<Pillar, 'featured'>,
  limit: number = 4
): Promise<ClipWithVenture[]> {
  const supabase = await createAdminClient();

  const segments = PILLAR_SEGMENTS[pillar];

  // Query clips that belong to this pillar's segments, ordered by trending score
  const { data: clips } = await supabase
    .from('clips')
    .select('*, ventures(*), founders(*)')
    .in('segment_key', segments)
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('counters->trending_score', { ascending: false })
    .limit(limit);

  if (!clips || clips.length === 0) return [];

  return clips.map((c) => {
    const venture = c.ventures as Record<string, unknown>;
    const founder = c.founders as Record<string, unknown>;

    return {
      _id: c.id,
      venture_id: c.venture_id,
      founder_id: c.founder_id,
      question_slug: c.question_slug,
      title: c.title,
      hook: c.hook,
      tagline: c.tagline,
      playback_id: c.playback_id,
      durationSec: c.duration_sec,
      thumbTime: c.thumb_time,
      segment_key: c.segment_key,
      counters: c.counters || {
        views: 0,
        completes: 0,
        likes: 0,
        comments: 0,
        rewatches: 0,
        follows_after: 0,
        avg_watch_percent: 0,
        endorsements_from_founders: 0,
        trending_score: 0,
      },
      published_at: c.published_at,
      created_at: c.created_at,
      venture: {
        slug: (venture?.slug as string) || '',
        name: (venture?.name as string) || 'Unknown',
        brand: (venture?.brand as string) || '#888',
        glyph: (venture?.glyph as string) || 'wave',
      },
      founder: {
        name: (founder?.name as string) || 'Unknown',
        slug: (founder?.slug as string) || '',
        location: founder?.location as string | undefined,
      },
    };
  });
}

/**
 * Get featured/staff picked clips
 */
export async function getFeaturedClips(limit: number = 4): Promise<ClipWithVenture[]> {
  const supabase = await createAdminClient();

  // Get active staff picks with clip data
  const { data: picks } = await supabase
    .from('staff_picks')
    .select('clip_id')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!picks || picks.length === 0) return [];

  const clipIds = picks.map((p) => p.clip_id);

  const { data: clips } = await supabase
    .from('clips')
    .select('*, ventures(*), founders(*)')
    .in('id', clipIds)
    .not('published_at', 'is', null)
    .is('deleted_at', null);

  if (!clips || clips.length === 0) return [];

  return clips.map((c) => {
    const venture = c.ventures as Record<string, unknown>;
    const founder = c.founders as Record<string, unknown>;

    return {
      _id: c.id,
      venture_id: c.venture_id,
      founder_id: c.founder_id,
      question_slug: c.question_slug,
      title: c.title,
      hook: c.hook,
      tagline: c.tagline,
      playback_id: c.playback_id,
      durationSec: c.duration_sec,
      thumbTime: c.thumb_time,
      segment_key: c.segment_key,
      counters: c.counters || {
        views: 0,
        completes: 0,
        likes: 0,
        comments: 0,
        rewatches: 0,
        follows_after: 0,
        avg_watch_percent: 0,
        endorsements_from_founders: 0,
        trending_score: 0,
      },
      published_at: c.published_at,
      created_at: c.created_at,
      venture: {
        slug: (venture?.slug as string) || '',
        name: (venture?.name as string) || 'Unknown',
        brand: (venture?.brand as string) || '#888',
        glyph: (venture?.glyph as string) || 'wave',
      },
      founder: {
        name: (founder?.name as string) || 'Unknown',
        slug: (founder?.slug as string) || '',
        location: founder?.location as string | undefined,
      },
    };
  });
}
