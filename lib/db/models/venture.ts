import mongoose, { Schema, Document, Types } from 'mongoose';

// Segment keys - the 16 fixed journey segments
export const SEGMENT_KEYS = [
  'pitch', 'spark', 'validation', 'audience', 'proto', 'build', 'beta', 'gtm',
  'launch', 'first', 'channel', 'trouble', 'money', 'team', 'scale', 'next'
] as const;

export type SegmentKey = typeof SEGMENT_KEYS[number];

// Rungs - the journey stages
export const RUNGS = ['idea', 'building', 'live', 'first', 'growing', 'alumni'] as const;
export type Rung = typeof RUNGS[number];

// Status
export type VentureStatus = 'draft' | 'live' | 'graduated' | 'closed';

export interface ISegment {
  body?: string;
  publishedAt?: Date;
  updatedAt?: Date;
}

export interface IPromise {
  text: string;
  dueAt: Date;
  createdAt: Date;
}

export interface IPromiseHistory {
  text: string;
  dueAt: Date;
  resolvedAt: Date;
  kept: boolean;
  note?: string;
}

export interface IVenture extends Document {
  slug: string;
  slugHistory: string[];
  founderId: Types.ObjectId;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: Rung;
  rungEnteredAt: Date;
  status: VentureStatus;
  media: {
    tier: 'video' | 'photo';
    coverKey?: string;
  };
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
  promise?: IPromise;
  promiseHistory: IPromiseHistory[];
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
  standards: {
    met: number;
    of: number;
    checkedAt?: Date;
  };
  publishedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const segmentSchema = new Schema<ISegment>(
  {
    body: String,
    publishedAt: Date,
    updatedAt: Date,
  },
  { _id: false }
);

const promiseSchema = new Schema<IPromise>(
  {
    text: { type: String, required: true },
    dueAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const promiseHistorySchema = new Schema<IPromiseHistory>(
  {
    text: { type: String, required: true },
    dueAt: { type: Date, required: true },
    resolvedAt: { type: Date, required: true },
    kept: { type: Boolean, required: true },
    note: String,
  },
  { _id: false }
);

const ventureSchema = new Schema<IVenture>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    slugHistory: [String],
    founderId: {
      type: Schema.Types.ObjectId,
      ref: 'Founder',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    pitch: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
    },
    glyph: {
      type: String,
      required: true,
    },
    rung: {
      type: String,
      enum: RUNGS,
      required: true,
    },
    rungEnteredAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'live', 'graduated', 'closed'],
      default: 'draft',
    },
    media: {
      tier: {
        type: String,
        enum: ['video', 'photo'],
        default: 'photo',
      },
      coverKey: String,
    },
    links: {
      site: String,
      siteStatus: {
        type: String,
        enum: ['live', 'waitlist', 'closed', 'none'],
      },
      ig: String,
      x: String,
      yt: String,
      tiktok: String,
    },
    problem: String,
    who: String,
    why: String,
    segments: {
      type: Map,
      of: segmentSchema,
      default: {},
    },
    promise: promiseSchema,
    promiseHistory: [promiseHistorySchema],
    counters: {
      followers: { type: Number, default: 0 },
      clips: { type: Number, default: 0 },
      photos: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      weekNumber: { type: Number, default: 1 },
      streakWeeks: { type: Number, default: 0 },
      lastPostedAt: Date,
      siteClicks30d: { type: Number, default: 0 },
      trendingScore: { type: Number, default: 0 },
    },
    standards: {
      met: { type: Number, default: 0 },
      of: { type: Number, default: 7 },
      checkedAt: Date,
    },
    publishedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes per architecture spec
ventureSchema.index({ slug: 1 }, { unique: true });
ventureSchema.index({ status: 1, 'counters.trendingScore': -1 });
ventureSchema.index({ rung: 1, publishedAt: -1 });
ventureSchema.index({ founderId: 1 });

export const Venture = mongoose.models.Venture || mongoose.model<IVenture>('Venture', ventureSchema);
