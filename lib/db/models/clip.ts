import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITranscriptLine {
  t: number; // timestamp in seconds
  line: string;
}

export interface IClip extends Document {
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
  transcript: ITranscriptLine[];
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

const transcriptLineSchema = new Schema<ITranscriptLine>(
  {
    t: { type: Number, required: true },
    line: { type: String, required: true },
  },
  { _id: false }
);

const clipSchema = new Schema<IClip>(
  {
    ventureId: {
      type: Schema.Types.ObjectId,
      ref: 'Venture',
      required: true,
    },
    founderId: {
      type: Schema.Types.ObjectId,
      ref: 'Founder',
      required: true,
    },
    questionSlug: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    hook: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    muxAssetId: String,
    playbackId: String,
    durationSec: {
      type: Number,
      required: true,
    },
    thumbTime: Number,
    transcript: [transcriptLineSchema],
    transcriptStatus: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed'],
      default: 'pending',
    },
    segmentKey: String,
    counters: {
      views: { type: Number, default: 0 },
      completes: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
    publishedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes per architecture spec
clipSchema.index({ questionSlug: 1, publishedAt: -1 });
clipSchema.index({ ventureId: 1, publishedAt: -1 });

export const Clip = mongoose.models.Clip || mongoose.model<IClip>('Clip', clipSchema);
