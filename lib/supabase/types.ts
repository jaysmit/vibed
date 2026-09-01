// Database types for Supabase

// Industry/category options for ventures
export const INDUSTRIES = [
  'tech',
  'saas',
  'ecommerce',
  'fintech',
  'health',
  'education',
  'media',
  'fashion',
  'food',
  'travel',
  'gaming',
  'ai',
  'crypto',
  'sustainability',
  'other',
] as const;

export type Industry = typeof INDUSTRIES[number];

export const INDUSTRY_LABELS: Record<Industry, string> = {
  tech: 'Tech',
  saas: 'SaaS',
  ecommerce: 'E-commerce',
  fintech: 'Fintech',
  health: 'Health',
  education: 'Education',
  media: 'Media',
  fashion: 'Fashion',
  food: 'Food & Beverage',
  travel: 'Travel',
  gaming: 'Gaming',
  ai: 'AI / ML',
  crypto: 'Crypto / Web3',
  sustainability: 'Sustainability',
  other: 'Other',
};

export interface Founder {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  links: Record<string, string | undefined>;
  avatar_key: string | null;
  created_at: string;
  updated_at: string;
}

// Extended founder with ventures for public profile
export interface FounderWithVentures extends Founder {
  ventures: (Venture & { role?: TeamRole })[];
}

// Segment entry with flexible timeline support
export interface SegmentEntry {
  body?: string;
  happenedAt?: string;  // When this actually happened (ISO date, for timeline ordering)
  publishedAt?: string;  // When founder published this content
  updatedAt?: string;   // When founder last edited this
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
  industry: Industry;
  country: string | null;
  categories: Industry[];
  status: 'draft' | 'live' | 'graduated' | 'closed';
  problem: string | null;
  who: string | null;
  why: string | null;
  segments: Record<string, SegmentEntry>;
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

// Team member roles
export const TEAM_ROLES = ['founder', 'partner', 'team_member'] as const;
export type TeamRole = typeof TEAM_ROLES[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  founder: 'Founder',
  partner: 'Partner',
  team_member: 'Team Member',
};

// Team member status
export const TEAM_STATUSES = ['pending', 'accepted', 'declined', 'removed'] as const;
export type TeamStatus = typeof TEAM_STATUSES[number];

export interface VentureMember {
  id: string;
  venture_id: string;
  founder_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: TeamRole;
  status: TeamStatus;
  is_master: boolean;
  invited_by: string | null;
  invitation_token: string | null;
  created_at: string;
  accepted_at: string | null;
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

// ============================================
// ENDORSEMENT SYSTEM
// ============================================

// Endorsement reason tags
export const ENDORSEMENT_REASONS = [
  'honest_failure',
  'useful_tactics',
  'changed_thinking',
  'less_alone',
] as const;

export type EndorsementReason = typeof ENDORSEMENT_REASONS[number];

export const ENDORSEMENT_REASON_LABELS: Record<EndorsementReason, string> = {
  honest_failure: 'Honest about failure',
  useful_tactics: 'Tactics I can use',
  changed_thinking: 'Changed how I think',
  less_alone: 'Made me feel less alone',
};

export interface ClipEndorsement {
  id: string;
  clip_id: string;
  user_id: string;
  reason: EndorsementReason | null;
  founder_rung: string | null; // snapshot of endorser's venture rung
  created_at: string;
}

// ============================================
// VIEW TRACKING
// ============================================

export interface ClipView {
  id: string;
  clip_id: string;
  user_id: string | null;
  anon_id: string | null;
  session_id: string | null;
  watch_percent: number;
  completed: boolean;
  rewatched: boolean;
  followed_venture_after: boolean;
  endorsed_after: boolean;
  created_at: string;
  updated_at: string;
}

// Extended clip counters (includes new tracking fields)
export interface ClipCounters {
  views: number;
  completes: number;
  likes: number; // endorsements count
  comments: number;
  rewatches: number;
  follows_after: number;
  avg_watch_percent: number;
  endorsements_from_founders: number;
  trending_score: number;
}

// ============================================
// STAFF PICKS
// ============================================

export const PILLARS = [
  'the_idea',
  'building_it',
  'getting_customers',
  'hard_parts',
  'featured',
] as const;

export type Pillar = typeof PILLARS[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  the_idea: 'The Idea',
  building_it: 'Building It',
  getting_customers: 'Getting Customers',
  hard_parts: 'The Hard Parts',
  featured: 'Staff Pick',
};

export const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  the_idea: 'How founders found and validated their ideas',
  building_it: 'The messy reality of building a product',
  getting_customers: 'Distribution, launches, and first sales',
  hard_parts: 'Setbacks, funding, and team challenges',
  featured: 'Editor\'s choice',
};

// Which segments belong to which pillar
export const PILLAR_SEGMENTS: Record<Exclude<Pillar, 'featured'>, string[]> = {
  the_idea: ['pitch', 'spark', 'validation'],
  building_it: ['proto', 'build', 'beta'],
  getting_customers: ['gtm', 'launch', 'channel', 'first', 'audience'],
  hard_parts: ['trouble', 'money', 'team', 'scale'],
};

export interface StaffPick {
  id: string;
  clip_id: string;
  pillar: Pillar;
  note: string | null;
  active: boolean;
  picked_by: string | null;
  created_at: string;
}
