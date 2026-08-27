import mongoose, { Schema, Document, Types } from 'mongoose';

// Event types from the architecture taxonomy
export const EVENT_TYPES = {
  // Progress events
  VENTURE_CREATED: 'venture.created',
  VENTURE_PUBLISHED: 'venture.published',
  VENTURE_RUNG_CHANGED: 'venture.rung_changed',
  SEGMENT_PUBLISHED: 'segment.published',
  SEGMENT_UPDATED: 'segment.updated',
  PROMISE_CREATED: 'promise.created',
  PROMISE_KEPT: 'promise.kept',
  PROMISE_BROKEN: 'promise.broken',
  CLIP_UPLOADED: 'clip.uploaded',
  CLIP_PUBLISHED: 'clip.published',
  TRANSCRIPT_READY: 'transcript.ready',
  STANDARDS_MET: 'standards.met',
  STANDARDS_LAPSED: 'standards.lapsed',
  VENTURE_GRADUATED: 'venture.graduated',
  VENTURE_CLOSED: 'venture.closed',

  // Engagement events
  CLIP_VIEW_START: 'clip.view_start',
  CLIP_PROGRESS: 'clip.progress',
  CLIP_COMPLETE: 'clip.complete',
  CLIP_LIKE: 'clip.like',
  CLIP_SHARE: 'clip.share',
  CLIP_UNLIKE: 'clip.unlike',
  COMMENT_CREATED: 'comment.created',
  COMMENT_DELETED: 'comment.deleted',
  FOLLOW_CREATED: 'follow.created',
  FOLLOW_REMOVED: 'follow.removed',
  VENTURE_PROFILE_VIEW: 'venture.profile_view',
  SEGMENT_EXPANDED: 'segment.expanded',
  SITE_CLICK: 'site_click',
  SOCIAL_CLICK: 'social_click',

  // Discovery/attribution events
  RAIL_IMPRESSION: 'rail.impression',
  RAIL_CLICK: 'rail.click',
  SEARCH_QUERY: 'search.query',
  QUESTION_VIEW: 'question.view',
  DIGEST_SENT: 'digest.sent',
  DIGEST_OPEN: 'digest.open',
  DIGEST_CLICK: 'digest.click',
  SIGNUP_STARTED: 'signup.started',
  SIGNUP_COMPLETED: 'signup.completed',

  // Founder-side events
  FOUNDER_LOGIN: 'founder.login',
  FOUNDER_EDITOR_OPEN: 'founder.editor_open',
  FOUNDER_PUBLISH_ATTEMPT: 'founder.publish_attempt',
  FOUNDER_STANDARDS_VIEW: 'founder.standards_view',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

export interface IEvent extends Document {
  at: Date;
  type: EventType;
  actorId?: Types.ObjectId; // user, or null if anonymous
  anonId?: string; // cookie id for logged-out
  ventureId?: Types.ObjectId;
  clipId?: Types.ObjectId;
  questionSlug?: string;
  meta: Record<string, unknown>; // type-specific, unstructured
  session?: string;
  ua?: string;
  country?: string;
  referrer?: string;
}

const eventSchema = new Schema<IEvent>(
  {
    at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    anonId: String,
    ventureId: {
      type: Schema.Types.ObjectId,
      ref: 'Venture',
    },
    clipId: {
      type: Schema.Types.ObjectId,
      ref: 'Clip',
    },
    questionSlug: String,
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    session: String,
    ua: String,
    country: String,
    referrer: String,
  },
  {
    timestamps: false, // we use 'at' instead
  }
);

// Indexes per architecture spec
eventSchema.index({ ventureId: 1, at: -1 });
eventSchema.index({ type: 1, at: -1 });
eventSchema.index({ at: -1 });

// TTL index for noisy events (clip.progress) - 6 months
// Note: This should be applied selectively, but Mongoose doesn't support conditional TTL
// We'll handle TTL cleanup in a worker job instead

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);
