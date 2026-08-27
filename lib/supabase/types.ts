// Database types for Supabase

export interface Founder {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  bio: string | null;
  location: string | null;
  links: Record<string, string | undefined>;
  avatar_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Venture {
  id: string;
  founder_id: string;
  slug: string;
  slug_history: string[];
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: string;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  problem: string | null;
  who: string | null;
  why: string | null;
  segments: Record<string, { body?: string; publishedAt?: string; updatedAt?: string }>;
  links: Record<string, string | undefined>;
  counters: {
    followers: number;
    clips: number;
    photos: number;
    likes: number;
    comments: number;
    weekNumber: number;
    streakWeeks: number;
    siteClicks30d: number;
    trendingScore: number;
  };
  promise: Record<string, unknown> | null;
  promise_history: Record<string, unknown>[];
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Clip {
  id: string;
  venture_id: string;
  founder_id: string;
  question_slug: string;
  title: string;
  hook: string | null;
  tagline: string | null;
  mux_asset_id: string | null;
  playback_id: string | null;
  duration_sec: number;
  thumb_time: number | null;
  transcript: { t: number; line: string }[];
  transcript_status: 'pending' | 'ready' | 'failed';
  segment_key: string | null;
  counters: {
    views: number;
    completes: number;
    likes: number;
    comments: number;
  };
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  id: string;
  user_id: string;
  venture_id: string;
  created_at: string;
}

export interface Event {
  id: string;
  type: string;
  venture_id: string | null;
  clip_id: string | null;
  actor_id: string | null;
  anon_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

// Event types (keep in sync with original)
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
