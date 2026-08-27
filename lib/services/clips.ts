import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';
import { QUESTIONS } from '@/lib/domain/questions';
import type { Founder } from '@/lib/supabase/types';

export interface CreateClipInput {
  ventureId: string;
  questionSlug: string;
  muxAssetId: string;
  playbackId: string;
  durationSec: number;
}

export interface UpdateClipInput {
  title?: string;
  hook?: string;
  tagline?: string;
  thumbTime?: number;
}

export async function createClip(input: CreateClipInput) {
  const supabase = await createAdminClient();

  const { ventureId, questionSlug, muxAssetId, playbackId, durationSec } = input;

  // Get venture
  const { data: venture } = await supabase
    .from('ventures')
    .select('*')
    .eq('id', ventureId)
    .single();

  if (!venture) {
    throw new Error('Venture not found');
  }

  // Generate title from question
  const question = QUESTIONS.find((q) => q.slug === questionSlug);
  const title = question?.q || 'Video clip';

  const { data: clip, error } = await supabase
    .from('clips')
    .insert({
      venture_id: ventureId,
      founder_id: venture.founder_id,
      question_slug: questionSlug,
      title,
      mux_asset_id: muxAssetId,
      playback_id: playbackId,
      duration_sec: durationSec,
      transcript: [],
      transcript_status: 'pending',
      counters: {
        views: 0,
        completes: 0,
        likes: 0,
        comments: 0,
      },
    })
    .select()
    .single();

  if (error || !clip) {
    throw new Error(`Failed to create clip: ${error?.message}`);
  }

  // Increment clip counter on venture
  const counters = venture.counters as { clips: number };
  await supabase
    .from('ventures')
    .update({
      counters: { ...venture.counters, clips: (counters.clips || 0) + 1 },
    })
    .eq('id', ventureId);

  // Log event
  await logEvent({
    type: EVENT_TYPES.CLIP_UPLOADED,
    ventureId,
    clipId: clip.id,
    meta: { questionSlug },
  });

  return {
    clipId: clip.id,
    playbackId: clip.playback_id,
  };
}

export async function updateClipTranscript(
  clipId: string,
  transcript: { t: number; line: string }[]
) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('clips')
    .update({
      transcript,
      transcript_status: 'ready',
    })
    .eq('id', clipId);

  if (error) {
    throw new Error(`Failed to update transcript: ${error.message}`);
  }

  const { data: clip } = await supabase
    .from('clips')
    .select('venture_id')
    .eq('id', clipId)
    .single();

  if (clip) {
    await logEvent({
      type: EVENT_TYPES.TRANSCRIPT_READY,
      ventureId: clip.venture_id,
      clipId,
      meta: { lineCount: transcript.length },
    });
  }

  return { success: true };
}

export async function markTranscriptFailed(clipId: string) {
  const supabase = await createAdminClient();

  await supabase
    .from('clips')
    .update({ transcript_status: 'failed' })
    .eq('id', clipId);

  return { success: true };
}

export async function publishClip(clipId: string, userId: string) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('*, founders(*)')
    .eq('id', clipId)
    .single();

  if (!clip) return null;

  // Verify ownership
  const founder = clip.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return null;
  }

  await supabase
    .from('clips')
    .update({ published_at: new Date().toISOString() })
    .eq('id', clipId);

  await logEvent({
    type: EVENT_TYPES.CLIP_PUBLISHED,
    ventureId: clip.venture_id,
    clipId,
    actorId: userId,
    meta: { questionSlug: clip.question_slug },
  });

  return { success: true };
}

export async function getClipsByVenture(ventureId: string) {
  const supabase = await createAdminClient();

  const { data: clips } = await supabase
    .from('clips')
    .select('*')
    .eq('venture_id', ventureId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (clips || []).map((clip) => ({
    ...clip,
    _id: clip.id,
    ventureId: clip.venture_id,
    founderId: clip.founder_id,
    questionSlug: clip.question_slug,
    playbackId: clip.playback_id,
    durationSec: clip.duration_sec,
    transcriptStatus: clip.transcript_status,
    publishedAt: clip.published_at,
    createdAt: clip.created_at,
  }));
}

export async function getClipByMuxAssetId(muxAssetId: string) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('*')
    .eq('mux_asset_id', muxAssetId)
    .single();

  if (!clip) return null;

  return {
    ...clip,
    _id: clip.id,
    ventureId: clip.venture_id,
    founderId: clip.founder_id,
  };
}

export async function deleteClip(clipId: string, userId: string) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('*, founders(*), ventures(*)')
    .eq('id', clipId)
    .single();

  if (!clip) return null;

  // Verify ownership
  const founder = clip.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return null;
  }

  // Soft delete
  await supabase
    .from('clips')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clipId);

  // Decrement counter
  const venture = clip.ventures as { counters: { clips: number } };
  const counters = venture.counters;
  await supabase
    .from('ventures')
    .update({
      counters: { ...venture.counters, clips: Math.max(0, (counters.clips || 0) - 1) },
    })
    .eq('id', clip.venture_id);

  return { success: true };
}
