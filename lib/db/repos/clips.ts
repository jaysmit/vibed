import { connectDB } from '../connect';
import { Clip, Venture, Founder } from '../models';
import type { Types } from 'mongoose';

export interface LeanClip {
  _id: Types.ObjectId;
  ventureId: Types.ObjectId;
  founderId: Types.ObjectId;
  questionSlug: string;
  title: string;
  hook?: string;
  tagline?: string;
  muxAssetId?: string;
  playbackId?: string;
  durationSec: number;
  thumbTime?: number;
  transcript: { t: number; line: string }[];
  transcriptStatus: 'pending' | 'processing' | 'ready' | 'failed';
  segmentKey?: string;
  counters: {
    views: number;
    completes: number;
    likes: number;
    comments: number;
  };
  publishedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClipWithContext extends LeanClip {
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

type LeanVenture = { _id: Types.ObjectId; slug: string; name: string; brand: string; glyph: string };
type LeanFounder = { _id: Types.ObjectId; name: string; slug: string; location?: string };

/**
 * Get clips by question slug
 */
export async function getClipsByQuestion(questionSlug: string): Promise<ClipWithContext[]> {
  await connectDB();

  const clips = await Clip.find({
    questionSlug,
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ publishedAt: -1 })
    .lean<LeanClip[]>();

  if (clips.length === 0) return [];

  // Fetch ventures and founders
  const ventureIds = [...new Set(clips.map((c) => c.ventureId.toString()))];
  const founderIds = [...new Set(clips.map((c) => c.founderId.toString()))];

  const [ventures, founders] = await Promise.all([
    Venture.find({ _id: { $in: ventureIds } }).lean<LeanVenture[]>(),
    Founder.find({ _id: { $in: founderIds } }).lean<LeanFounder[]>(),
  ]);

  const ventureMap = new Map(ventures.map((v) => [v._id.toString(), v]));
  const founderMap = new Map(founders.map((f) => [f._id.toString(), f]));

  return clips.map((c) => {
    const venture = ventureMap.get(c.ventureId.toString());
    const founder = founderMap.get(c.founderId.toString());
    return {
      ...c,
      venture: {
        slug: venture?.slug || '',
        name: venture?.name || 'Unknown',
        brand: venture?.brand || '#888',
        glyph: venture?.glyph || 'wave',
      },
      founder: {
        name: founder?.name || 'Unknown',
        slug: founder?.slug || '',
        location: founder?.location,
      },
    };
  });
}

/**
 * Get clips for a venture
 */
export async function getClipsByVenture(ventureId: string): Promise<LeanClip[]> {
  await connectDB();

  return Clip.find({
    ventureId,
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ publishedAt: -1 })
    .lean<LeanClip[]>();
}

/**
 * Get recent clips across all ventures
 */
export async function getRecentClips(limit = 20): Promise<ClipWithContext[]> {
  await connectDB();

  const clips = await Clip.find({
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean<LeanClip[]>();

  if (clips.length === 0) return [];

  const ventureIds = [...new Set(clips.map((c) => c.ventureId.toString()))];
  const founderIds = [...new Set(clips.map((c) => c.founderId.toString()))];

  const [ventures, founders] = await Promise.all([
    Venture.find({ _id: { $in: ventureIds } }).lean<LeanVenture[]>(),
    Founder.find({ _id: { $in: founderIds } }).lean<LeanFounder[]>(),
  ]);

  const ventureMap = new Map(ventures.map((v) => [v._id.toString(), v]));
  const founderMap = new Map(founders.map((f) => [f._id.toString(), f]));

  return clips.map((c) => {
    const venture = ventureMap.get(c.ventureId.toString());
    const founder = founderMap.get(c.founderId.toString());
    return {
      ...c,
      venture: {
        slug: venture?.slug || '',
        name: venture?.name || 'Unknown',
        brand: venture?.brand || '#888',
        glyph: venture?.glyph || 'wave',
      },
      founder: {
        name: founder?.name || 'Unknown',
        slug: founder?.slug || '',
        location: founder?.location,
      },
    };
  });
}
