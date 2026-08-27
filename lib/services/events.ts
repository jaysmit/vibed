import { connectDB } from '@/lib/db/connect';
import { Event, EVENT_TYPES, type EventType } from '@/lib/db/models';
import type { Types } from 'mongoose';

// Valid event types for client-side tracking (untrusted)
const CLIENT_EVENT_TYPES: Set<string> = new Set([
  EVENT_TYPES.RAIL_IMPRESSION,
  EVENT_TYPES.RAIL_CLICK,
  EVENT_TYPES.CLIP_VIEW_START,
  EVENT_TYPES.CLIP_PROGRESS,
  EVENT_TYPES.CLIP_COMPLETE,
  EVENT_TYPES.VENTURE_PROFILE_VIEW,
  EVENT_TYPES.SEGMENT_EXPANDED,
  EVENT_TYPES.SITE_CLICK,
  EVENT_TYPES.SOCIAL_CLICK,
  EVENT_TYPES.QUESTION_VIEW,
  EVENT_TYPES.SEARCH_QUERY,
]);

// Server-only event types (trusted)
const SERVER_EVENT_TYPES = new Set([
  EVENT_TYPES.VENTURE_CREATED,
  EVENT_TYPES.VENTURE_PUBLISHED,
  EVENT_TYPES.VENTURE_RUNG_CHANGED,
  EVENT_TYPES.SEGMENT_PUBLISHED,
  EVENT_TYPES.SEGMENT_UPDATED,
  EVENT_TYPES.PROMISE_CREATED,
  EVENT_TYPES.PROMISE_KEPT,
  EVENT_TYPES.PROMISE_BROKEN,
  EVENT_TYPES.CLIP_UPLOADED,
  EVENT_TYPES.CLIP_PUBLISHED,
  EVENT_TYPES.TRANSCRIPT_READY,
  EVENT_TYPES.STANDARDS_MET,
  EVENT_TYPES.STANDARDS_LAPSED,
  EVENT_TYPES.VENTURE_GRADUATED,
  EVENT_TYPES.VENTURE_CLOSED,
  EVENT_TYPES.CLIP_LIKE,
  EVENT_TYPES.CLIP_UNLIKE,
  EVENT_TYPES.CLIP_SHARE,
  EVENT_TYPES.COMMENT_CREATED,
  EVENT_TYPES.COMMENT_DELETED,
  EVENT_TYPES.FOLLOW_CREATED,
  EVENT_TYPES.FOLLOW_REMOVED,
  EVENT_TYPES.DIGEST_SENT,
  EVENT_TYPES.DIGEST_OPEN,
  EVENT_TYPES.DIGEST_CLICK,
  EVENT_TYPES.SIGNUP_STARTED,
  EVENT_TYPES.SIGNUP_COMPLETED,
  EVENT_TYPES.FOUNDER_LOGIN,
  EVENT_TYPES.FOUNDER_EDITOR_OPEN,
  EVENT_TYPES.FOUNDER_PUBLISH_ATTEMPT,
  EVENT_TYPES.FOUNDER_STANDARDS_VIEW,
]);

export interface LogEventParams {
  type: EventType;
  actorId?: Types.ObjectId | string;
  anonId?: string;
  ventureId?: Types.ObjectId | string;
  clipId?: Types.ObjectId | string;
  questionSlug?: string;
  meta?: Record<string, unknown>;
  session?: string;
  ua?: string;
  country?: string;
  referrer?: string;
}

/**
 * Strip dangerous keys from user input (Mongo operator injection prevention)
 */
function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    // Skip keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMeta(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Log an event to the database (server-side, trusted)
 */
export async function logEvent(params: LogEventParams): Promise<void> {
  await connectDB();

  const event = new Event({
    at: new Date(),
    type: params.type,
    actorId: params.actorId,
    anonId: params.anonId,
    ventureId: params.ventureId,
    clipId: params.clipId,
    questionSlug: params.questionSlug,
    meta: params.meta ? sanitizeMeta(params.meta) : {},
    session: params.session,
    ua: params.ua,
    country: params.country,
    referrer: params.referrer,
  });

  await event.save();
}

/**
 * Log a client-side event (untrusted, validated)
 * Returns false if the event type is not allowed from client
 */
export async function logClientEvent(params: LogEventParams): Promise<boolean> {
  // Validate event type is allowed from client
  if (!CLIENT_EVENT_TYPES.has(params.type)) {
    console.warn(`Blocked client event type: ${params.type}`);
    return false;
  }

  // Sanitize meta to prevent injection
  const sanitizedParams = {
    ...params,
    meta: params.meta ? sanitizeMeta(params.meta) : {},
  };

  await logEvent(sanitizedParams);
  return true;
}

/**
 * Check if an event type is valid
 */
export function isValidEventType(type: string): type is EventType {
  return Object.values(EVENT_TYPES).includes(type as EventType);
}

/**
 * Check if an event type can be sent from client
 */
export function isClientEventType(type: string): boolean {
  return CLIENT_EVENT_TYPES.has(type as EventType);
}

// Simple in-memory rate limiter for MVP
// In production, use Redis or a proper rate limiting service
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute per anonId

/**
 * Check rate limit for an anonymous ID
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(anonId: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(anonId);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(anonId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return false;
  }

  existing.count++;
  return true;
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);
