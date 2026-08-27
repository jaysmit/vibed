import { connectDB } from '../connect';
import { Venture, Founder, type Rung, type SegmentKey, type ISegment } from '../models';
import type { Types } from 'mongoose';

export interface VentureWithFounder {
  _id: Types.ObjectId;
  slug: string;
  slugHistory: string[];
  founderId: Types.ObjectId;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: Rung;
  rungEnteredAt: Date;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  media: { tier: 'video' | 'photo'; coverKey?: string };
  links: {
    site?: string;
    siteStatus?: 'live' | 'waitlist' | 'closed' | 'none';
    ig?: string;
    x?: string;
    yt?: string;
    tiktok?: string;
  };
  problem?: string;
  who?: string;
  why?: string;
  segments: Partial<Record<SegmentKey, ISegment>>;
  promise?: { text: string; dueAt: Date; createdAt: Date };
  promiseHistory: { text: string; dueAt: Date; resolvedAt: Date; kept: boolean; note?: string }[];
  counters: {
    followers: number;
    clips: number;
    photos: number;
    likes: number;
    comments: number;
    weekNumber: number;
    streakWeeks: number;
    lastPostedAt?: Date;
    siteClicks30d: number;
    trendingScore: number;
  };
  standards: { met: number; of: number; checkedAt?: Date };
  publishedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  founder: {
    name: string;
    slug: string;
    location?: string;
  };
  _redirect?: string;
}

type LeanVenture = Omit<VentureWithFounder, 'founder' | '_redirect'>;
type LeanFounder = { _id: Types.ObjectId; name: string; slug: string; location?: string };

/**
 * Get all published ventures for the landing page
 */
export async function getPublishedVentures(): Promise<VentureWithFounder[]> {
  await connectDB();

  const ventures = await Venture.find({
    status: { $in: ['live', 'graduated', 'closed'] },
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ 'counters.trendingScore': -1, publishedAt: -1 })
    .lean<LeanVenture[]>();

  if (ventures.length === 0) return [];

  const founderIds = ventures.map((v) => v.founderId);
  const founders = await Founder.find({ _id: { $in: founderIds } }).lean<LeanFounder[]>();
  const founderMap = new Map(founders.map((f) => [f._id.toString(), f]));

  return ventures.map((v) => {
    const founder = founderMap.get(v.founderId.toString());
    return {
      ...v,
      founder: {
        name: founder?.name || 'Unknown',
        slug: founder?.slug || '',
        location: founder?.location,
      },
    };
  });
}

/**
 * Get ventures by rung
 */
export async function getVenturesByRung(rung: Rung): Promise<VentureWithFounder[]> {
  await connectDB();

  const ventures = await Venture.find({
    rung,
    status: { $in: ['live', 'graduated', 'closed'] },
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ publishedAt: -1 })
    .lean<LeanVenture[]>();

  if (ventures.length === 0) return [];

  const founderIds = ventures.map((v) => v.founderId);
  const founders = await Founder.find({ _id: { $in: founderIds } }).lean<LeanFounder[]>();
  const founderMap = new Map(founders.map((f) => [f._id.toString(), f]));

  return ventures.map((v) => {
    const founder = founderMap.get(v.founderId.toString());
    return {
      ...v,
      founder: {
        name: founder?.name || 'Unknown',
        slug: founder?.slug || '',
        location: founder?.location,
      },
    };
  });
}

/**
 * Get a single venture by slug
 */
export async function getVentureBySlug(slug: string): Promise<VentureWithFounder | null> {
  await connectDB();

  const venture = await Venture.findOne({
    $or: [{ slug }, { slugHistory: slug }],
    deletedAt: null,
  }).lean<LeanVenture | null>();

  if (!venture) return null;

  // If found via slugHistory, this should redirect
  if (venture.slug !== slug) {
    return { ...venture, _redirect: venture.slug, founder: { name: '', slug: '', location: '' } };
  }

  // Draft ventures return null (404) for non-owners
  if (venture.status === 'draft') {
    return null;
  }

  const founder = await Founder.findById(venture.founderId).lean<LeanFounder | null>();

  return {
    ...venture,
    founder: {
      name: founder?.name || 'Unknown',
      slug: founder?.slug || '',
      location: founder?.location,
    },
  };
}

/**
 * Get featured venture (highest trending score)
 */
export async function getFeaturedVenture(): Promise<VentureWithFounder | null> {
  await connectDB();

  const venture = await Venture.findOne({
    status: 'live',
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ 'counters.trendingScore': -1 })
    .lean<LeanVenture | null>();

  if (!venture) return null;

  const founder = await Founder.findById(venture.founderId).lean<LeanFounder | null>();

  return {
    ...venture,
    founder: {
      name: founder?.name || 'Unknown',
      slug: founder?.slug || '',
      location: founder?.location,
    },
  };
}

/**
 * Get closed/dead ventures for post-mortems
 */
export async function getClosedVentures(): Promise<VentureWithFounder[]> {
  await connectDB();

  const ventures = await Venture.find({
    status: 'closed',
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ publishedAt: -1 })
    .lean<LeanVenture[]>();

  if (ventures.length === 0) return [];

  const founderIds = ventures.map((v) => v.founderId);
  const founders = await Founder.find({ _id: { $in: founderIds } }).lean<LeanFounder[]>();
  const founderMap = new Map(founders.map((f) => [f._id.toString(), f]));

  return ventures.map((v) => {
    const founder = founderMap.get(v.founderId.toString());
    return {
      ...v,
      founder: {
        name: founder?.name || 'Unknown',
        slug: founder?.slug || '',
        location: founder?.location,
      },
    };
  });
}

/**
 * Get graduated (alumni) ventures
 */
export async function getGraduatedVentures(): Promise<VentureWithFounder[]> {
  await connectDB();

  const ventures = await Venture.find({
    status: 'graduated',
    publishedAt: { $ne: null },
    deletedAt: null,
  })
    .sort({ publishedAt: -1 })
    .lean<LeanVenture[]>();

  if (ventures.length === 0) return [];

  const founderIds = ventures.map((v) => v.founderId);
  const founders = await Founder.find({ _id: { $in: founderIds } }).lean<LeanFounder[]>();
  const founderMap = new Map(founders.map((f) => [f._id.toString(), f]));

  return ventures.map((v) => {
    const founder = founderMap.get(v.founderId.toString());
    return {
      ...v,
      founder: {
        name: founder?.name || 'Unknown',
        slug: founder?.slug || '',
        location: founder?.location,
      },
    };
  });
}

/**
 * Get ventures by IDs (for following page)
 */
export async function getVenturesByIds(ids: string[]): Promise<VentureWithFounder[]> {
  await connectDB();

  if (ids.length === 0) return [];

  const ventures = await Venture.find({
    _id: { $in: ids },
    deletedAt: null,
  })
    .sort({ 'counters.lastPostedAt': -1, publishedAt: -1 })
    .lean<LeanVenture[]>();

  if (ventures.length === 0) return [];

  const founderIds = ventures.map((v) => v.founderId);
  const founders = await Founder.find({ _id: { $in: founderIds } }).lean<LeanFounder[]>();
  const founderMap = new Map(founders.map((f) => [f._id.toString(), f]));

  return ventures.map((v) => {
    const founder = founderMap.get(v.founderId.toString());
    return {
      ...v,
      founder: {
        name: founder?.name || 'Unknown',
        slug: founder?.slug || '',
        location: founder?.location,
      },
    };
  });
}
