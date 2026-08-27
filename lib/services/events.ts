import { createAdminClient } from '@/lib/supabase/server';
import { EVENT_TYPES, type EventType } from '@/lib/supabase/types';

// Re-export EVENT_TYPES for backwards compatibility
export { EVENT_TYPES };

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

export interface LogEventParams {
  type: EventType;
  actorId?: string;
  anonId?: string;
  ventureId?: string;
  clipId?: string;
  questionSlug?: string;
  meta?: Record<string, unknown>;
  session?: string;
  ua?: string;
  country?: string;
  referrer?: string;
}

/**
 * Strip dangerous keys from user input (SQL injection prevention)
 */
function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    // Skip keys starting with $ or containing special chars
    if (key.startsWith('$') || key.includes('.') || key.includes(';')) {
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
  const supabase = await createAdminClient();

  const { error } = await supabase.from('events').insert({
    type: params.type,
    actor_id: params.actorId || null,
    anon_id: params.anonId || null,
    venture_id: params.ventureId || null,
    clip_id: params.clipId || null,
    meta: params.meta ? sanitizeMeta(params.meta) : {},
  });

  if (error) {
    console.error('Failed to log event:', error);
  }
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

// Cleanup old rate limit entries periodically (only in long-running processes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60 * 1000);
}
