import { connectDB } from '@/lib/db/connect';
import { Clip, Venture, Founder, EVENT_TYPES } from '@/lib/db/models';
import { logEvent } from './events';
import { Types } from 'mongoose';
import { QUESTIONS } from '@/lib/domain/questions';

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
  await connectDB();

  const { ventureId, questionSlug, muxAssetId, playbackId, durationSec } = input;

  // Get venture and founder
  const venture = await Venture.findById(ventureId);
  if (!venture) {
    throw new Error('Venture not found');
  }

  // Generate title from question
  const question = QUESTIONS.find((q) => q.slug === questionSlug);
  const title = question?.q || 'Video clip';

  const clip = await Clip.create({
    ventureId: new Types.ObjectId(ventureId),
    founderId: venture.founderId,
    questionSlug,
    title,
    muxAssetId,
    playbackId,
    durationSec,
    transcript: [],
    transcriptStatus: 'pending',
    counters: {
      views: 0,
      completes: 0,
      likes: 0,
      comments: 0,
    },
  });

  // Increment clip counter on venture
  await Venture.updateOne(
    { _id: ventureId },
    { $inc: { 'counters.clips': 1 } }
  );

  // Log event
  await logEvent({
    type: EVENT_TYPES.CLIP_UPLOADED,
    ventureId,
    clipId: clip._id.toString(),
    meta: { questionSlug },
  });

  return {
    clipId: clip._id.toString(),
    playbackId: clip.playbackId,
  };
}

export async function updateClipTranscript(
  clipId: string,
  transcript: { t: number; line: string }[]
) {
  await connectDB();

  await Clip.updateOne(
    { _id: clipId },
    {
      $set: {
        transcript,
        transcriptStatus: 'ready',
      },
    }
  );

  const clip = await Clip.findById(clipId);
  if (clip) {
    await logEvent({
      type: EVENT_TYPES.TRANSCRIPT_READY,
      ventureId: clip.ventureId.toString(),
      clipId,
      meta: { lineCount: transcript.length },
    });
  }

  return { success: true };
}

export async function markTranscriptFailed(clipId: string) {
  await connectDB();

  await Clip.updateOne(
    { _id: clipId },
    { $set: { transcriptStatus: 'failed' } }
  );

  return { success: true };
}

export async function publishClip(clipId: string, userId: string) {
  await connectDB();

  const clip = await Clip.findById(clipId);
  if (!clip) return null;

  // Verify ownership
  const founder = await Founder.findById(clip.founderId);
  if (!founder || founder.userId.toString() !== userId) {
    return null;
  }

  clip.publishedAt = new Date();
  await clip.save();

  await logEvent({
    type: EVENT_TYPES.CLIP_PUBLISHED,
    ventureId: clip.ventureId.toString(),
    clipId,
    actorId: userId,
    meta: { questionSlug: clip.questionSlug },
  });

  return { success: true };
}

interface LeanClip {
  _id: Types.ObjectId;
  ventureId: Types.ObjectId;
  founderId: Types.ObjectId;
  questionSlug: string;
  title: string;
  playbackId?: string;
  durationSec: number;
  transcriptStatus: string;
  publishedAt?: Date;
  createdAt: Date;
}

export async function getClipsByVenture(ventureId: string) {
  await connectDB();

  const clips = await Clip.find({
    ventureId: new Types.ObjectId(ventureId),
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .lean<LeanClip[]>();

  return clips.map((clip) => ({
    ...clip,
    _id: clip._id.toString(),
    ventureId: clip.ventureId.toString(),
    founderId: clip.founderId.toString(),
  }));
}

export async function getClipByMuxAssetId(muxAssetId: string) {
  await connectDB();

  const clip = await Clip.findOne({ muxAssetId }).lean<LeanClip>();
  if (!clip) return null;

  return {
    ...clip,
    _id: clip._id.toString(),
    ventureId: clip.ventureId.toString(),
    founderId: clip.founderId.toString(),
  };
}

export async function deleteClip(clipId: string, userId: string) {
  await connectDB();

  const clip = await Clip.findById(clipId);
  if (!clip) return null;

  // Verify ownership
  const founder = await Founder.findById(clip.founderId);
  if (!founder || founder.userId.toString() !== userId) {
    return null;
  }

  clip.deletedAt = new Date();
  await clip.save();

  // Decrement counter
  await Venture.updateOne(
    { _id: clip.ventureId },
    { $inc: { 'counters.clips': -1 } }
  );

  return { success: true };
}
