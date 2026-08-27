import { connectDB } from '@/lib/db/connect';
import { Venture, Founder, User, EVENT_TYPES } from '@/lib/db/models';
import { logEvent } from './events';
import type { Rung, SegmentKey } from '@/lib/domain/rungs';
import { Types } from 'mongoose';

// Generate a URL-safe slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// Generate a random brand color
function generateBrandColor(): string {
  const hues = [
    '#1F6F5C', '#B4621A', '#5A2EC4', '#1A5C8A', '#9A2A55',
    '#3D5A2B', '#8A5A1A', '#4A4A8A', '#2A6B8A', '#6B2A5A',
  ];
  return hues[Math.floor(Math.random() * hues.length)];
}

export interface CreateVentureInput {
  userId: string;
  name: string;
  pitch: string;
  founderName: string;
  founderBio?: string;
  founderLocation?: string;
}

export interface UpdateVentureInput {
  name?: string;
  pitch?: string;
  problem?: string;
  who?: string;
  why?: string;
  glyph?: string;
  brand?: string;
  links?: {
    site?: string;
    siteStatus?: 'live' | 'waitlist' | 'closed' | 'none';
    ig?: string;
    x?: string;
    yt?: string;
    tiktok?: string;
  };
}

export interface UpdateSegmentInput {
  body: string;
}

// Type for lean venture documents
interface LeanVenture {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: Rung;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  founderId: Types.ObjectId;
  segments: Map<string, { body?: string; publishedAt?: Date; updatedAt?: Date }>;
  counters: {
    followers: number;
    clips: number;
    weekNumber: number;
    streakWeeks: number;
  };
  problem?: string;
  who?: string;
  why?: string;
  links: Record<string, string | undefined>;
}

interface LeanFounder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  slug: string;
  bio?: string;
  location?: string;
}

export async function createVenture(input: CreateVentureInput) {
  await connectDB();

  const { userId, name, pitch, founderName, founderBio, founderLocation } = input;

  // Update user role to founder
  await User.updateOne(
    { _id: userId },
    { $set: { role: 'founder', name: founderName } }
  );

  // Create founder profile
  const baseSlug = generateSlug(founderName);
  let founderSlug = baseSlug;
  let counter = 1;

  // Ensure unique founder slug
  while (await Founder.exists({ slug: founderSlug })) {
    founderSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const founder = await Founder.create({
    userId: new Types.ObjectId(userId),
    name: founderName,
    slug: founderSlug,
    bio: founderBio || '',
    location: founderLocation || '',
  });

  // Create venture
  const ventureBaseSlug = generateSlug(name);
  let ventureSlug = ventureBaseSlug;
  counter = 1;

  // Ensure unique venture slug
  while (await Venture.exists({ slug: ventureSlug })) {
    ventureSlug = `${ventureBaseSlug}-${counter}`;
    counter++;
  }

  const venture = await Venture.create({
    slug: ventureSlug,
    founderId: founder._id,
    name,
    pitch,
    brand: generateBrandColor(),
    glyph: 'wave', // default glyph
    rung: 'idea' as Rung,
    rungEnteredAt: new Date(),
    status: 'draft',
    media: { tier: 'photo' },
    links: {},
    segments: {},
    promiseHistory: [],
    counters: {
      followers: 0,
      clips: 0,
      photos: 0,
      likes: 0,
      comments: 0,
      weekNumber: 1,
      streakWeeks: 0,
      siteClicks30d: 0,
      trendingScore: 0,
    },
    standards: {
      met: 0,
      of: 7,
    },
  });

  // Log event
  await logEvent({
    type: EVENT_TYPES.VENTURE_CREATED,
    actorId: userId,
    ventureId: venture._id.toString(),
    meta: { slug: ventureSlug },
  });

  return {
    ventureId: venture._id.toString(),
    ventureSlug: venture.slug,
    founderId: founder._id.toString(),
    founderSlug: founder.slug,
  };
}

export async function getVentureForEdit(ventureId: string, userId: string) {
  await connectDB();

  const venture = await Venture.findById(ventureId).lean<LeanVenture>();
  if (!venture) return null;

  // Verify ownership
  const founder = await Founder.findById(venture.founderId).lean<LeanFounder>();
  if (!founder || founder.userId.toString() !== userId) {
    return null; // Not the owner
  }

  return {
    ...venture,
    _id: venture._id.toString(),
    founderId: venture.founderId.toString(),
  };
}

export async function getVentureByFounderUserId(userId: string) {
  await connectDB();

  const founder = await Founder.findOne({ userId: new Types.ObjectId(userId) }).lean<LeanFounder>();
  if (!founder) return null;

  const venture = await Venture.findOne({ founderId: founder._id }).lean<LeanVenture>();
  if (!venture) return null;

  // Convert Map to plain object for serialization
  const segmentsObj: Record<string, { body?: string }> = {};
  if (venture.segments instanceof Map) {
    venture.segments.forEach((value, key) => {
      segmentsObj[key] = value;
    });
  } else if (venture.segments && typeof venture.segments === 'object') {
    Object.assign(segmentsObj, venture.segments);
  }

  return {
    ...venture,
    segments: segmentsObj,
    _id: venture._id.toString(),
    founderId: venture.founderId.toString(),
    founder: {
      name: founder.name,
      slug: founder.slug,
      bio: founder.bio,
      location: founder.location,
    },
  };
}

export async function updateVenture(
  ventureId: string,
  userId: string,
  updates: UpdateVentureInput
) {
  await connectDB();

  // Verify ownership
  const venture = await Venture.findById(ventureId);
  if (!venture) return null;

  const founder = await Founder.findById(venture.founderId);
  if (!founder || founder.userId.toString() !== userId) {
    return null;
  }

  // Apply updates
  Object.assign(venture, updates);
  venture.updatedAt = new Date();
  await venture.save();

  return { success: true };
}

export async function updateSegment(
  ventureId: string,
  userId: string,
  segmentKey: SegmentKey,
  input: UpdateSegmentInput
) {
  await connectDB();

  // Verify ownership
  const venture = await Venture.findById(ventureId);
  if (!venture) return null;

  const founder = await Founder.findById(venture.founderId);
  if (!founder || founder.userId.toString() !== userId) {
    return null;
  }

  const isNew = !venture.segments.get(segmentKey)?.body;

  // Update segment
  venture.segments.set(segmentKey, {
    body: input.body,
    publishedAt: venture.segments.get(segmentKey)?.publishedAt || new Date(),
    updatedAt: new Date(),
  });

  await venture.save();

  // Log event
  await logEvent({
    type: isNew ? EVENT_TYPES.SEGMENT_PUBLISHED : EVENT_TYPES.SEGMENT_UPDATED,
    actorId: userId,
    ventureId: ventureId,
    meta: { segment: segmentKey },
  });

  return { success: true };
}

export async function publishVenture(ventureId: string, userId: string) {
  await connectDB();

  // Verify ownership
  const venture = await Venture.findById(ventureId);
  if (!venture) return null;

  const founder = await Founder.findById(venture.founderId);
  if (!founder || founder.userId.toString() !== userId) {
    return null;
  }

  if (venture.status !== 'draft') {
    return { success: true, alreadyPublished: true };
  }

  venture.status = 'live';
  venture.publishedAt = new Date();
  await venture.save();

  await logEvent({
    type: EVENT_TYPES.VENTURE_PUBLISHED,
    actorId: userId,
    ventureId: ventureId,
    meta: { slug: venture.slug },
  });

  return { success: true };
}

export async function updateRung(ventureId: string, userId: string, rung: Rung) {
  await connectDB();

  const venture = await Venture.findById(ventureId);
  if (!venture) return null;

  const founder = await Founder.findById(venture.founderId);
  if (!founder || founder.userId.toString() !== userId) {
    return null;
  }

  const oldRung = venture.rung;
  venture.rung = rung;
  venture.rungEnteredAt = new Date();
  await venture.save();

  await logEvent({
    type: EVENT_TYPES.VENTURE_RUNG_CHANGED,
    actorId: userId,
    ventureId: ventureId,
    meta: { from: oldRung, to: rung },
  });

  return { success: true };
}
