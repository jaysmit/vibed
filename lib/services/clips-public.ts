import { createAdminClient } from '@/lib/supabase/server';

export interface ClipWithContext {
  _id: string;
  venture_id: string;
  founder_id: string;
  question_slug: string;
  title: string;
  hook?: string;
  tagline?: string;
  mux_asset_id?: string;
  playback_id?: string;
  durationSec: number;
  thumbTime?: number;
  transcript: { t: number; line: string }[];
  transcriptStatus: 'pending' | 'processing' | 'ready' | 'failed';
  segment_key?: string;
  counters: {
    views: number;
    completes: number;
    likes: number;
    comments: number;
  };
  published_at?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
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

export async function getClipsByQuestion(questionSlug: string): Promise<ClipWithContext[]> {
  const supabase = await createAdminClient();

  const { data: clips } = await supabase
    .from('clips')
    .select('*, ventures(*), founders(*)')
    .eq('question_slug', questionSlug)
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

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
      mux_asset_id: c.mux_asset_id,
      playback_id: c.playback_id,
      durationSec: c.duration_sec,
      thumbTime: c.thumb_time,
      transcript: c.transcript || [],
      transcriptStatus: c.transcript_status,
      segment_key: c.segment_key,
      counters: c.counters || { views: 0, completes: 0, likes: 0, comments: 0 },
      published_at: c.published_at,
      deleted_at: c.deleted_at,
      created_at: c.created_at,
      updated_at: c.updated_at,
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

export async function getRecentClips(limit = 20): Promise<ClipWithContext[]> {
  const supabase = await createAdminClient();

  const { data: clips } = await supabase
    .from('clips')
    .select('*, ventures(*), founders(*)')
    .not('published_at', 'is', null)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
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
      mux_asset_id: c.mux_asset_id,
      playback_id: c.playback_id,
      durationSec: c.duration_sec,
      thumbTime: c.thumb_time,
      transcript: c.transcript || [],
      transcriptStatus: c.transcript_status,
      segment_key: c.segment_key,
      counters: c.counters || { views: 0, completes: 0, likes: 0, comments: 0 },
      published_at: c.published_at,
      deleted_at: c.deleted_at,
      created_at: c.created_at,
      updated_at: c.updated_at,
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
