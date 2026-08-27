'use client';

import { ulid } from 'ulid';

const ANON_ID_KEY = 'vibed_anon_id';
const SESSION_KEY = 'vibed_session';

/**
 * Get or create a persistent anonymous ID for tracking
 */
export function getAnonId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = ulid();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

/**
 * Get or create a session ID (resets on browser close)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = ulid();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

interface TrackEventParams {
  type: string;
  ventureId?: string;
  clipId?: string;
  questionSlug?: string;
  meta?: Record<string, unknown>;
}

// Queue for batching events
let eventQueue: Array<TrackEventParams & { anonId: string; session: string; referrer: string }> = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

const FLUSH_INTERVAL_MS = 2000; // Flush every 2 seconds
const FLUSH_SIZE = 10; // Or when we have 10 events

/**
 * Flush the event queue to the server
 */
async function flushEvents() {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  try {
    await fetch('/api/track', {
      method: 'PUT', // Batch endpoint
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
      // Don't block navigation
      keepalive: true,
    });
  } catch (error) {
    // Silent failure - analytics should never break the app
    console.debug('Failed to track events:', error);
  }
}

/**
 * Track a client-side event
 */
export function trackEvent(params: TrackEventParams): void {
  if (typeof window === 'undefined') return;

  const anonId = getAnonId();
  const session = getSessionId();
  const referrer = document.referrer || '';

  eventQueue.push({
    ...params,
    anonId,
    session,
    referrer,
  });

  // Flush if we have enough events
  if (eventQueue.length >= FLUSH_SIZE) {
    flushEvents();
    return;
  }

  // Otherwise set a timer to flush
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushEvents, FLUSH_INTERVAL_MS);
  }
}

/**
 * Track a single event immediately (for important events like clicks before navigation)
 */
export async function trackEventImmediate(params: TrackEventParams): Promise<void> {
  if (typeof window === 'undefined') return;

  const anonId = getAnonId();
  const session = getSessionId();
  const referrer = document.referrer || '';

  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        anonId,
        session,
        referrer,
      }),
      keepalive: true,
    });
  } catch (error) {
    console.debug('Failed to track event:', error);
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEvents();
    }
  });

  window.addEventListener('pagehide', () => {
    flushEvents();
  });
}
