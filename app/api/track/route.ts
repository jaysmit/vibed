import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logClientEvent, isValidEventType, isClientEventType, checkRateLimit } from '@/lib/services/events';
import type { EventType } from '@/lib/db/models';

// Request body schema
const trackEventSchema = z.object({
  type: z.string(),
  ventureId: z.string().optional(),
  clipId: z.string().optional(),
  questionSlug: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
  anonId: z.string().min(1).max(64),
  session: z.string().optional(),
  referrer: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = trackEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, ventureId, clipId, questionSlug, meta, anonId, session, referrer } = parsed.data;

    // Validate event type
    if (!isValidEventType(type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Check if event type is allowed from client
    if (!isClientEventType(type)) {
      return NextResponse.json(
        { error: 'Event type not allowed from client' },
        { status: 403 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(anonId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get user agent and country from headers
    const ua = request.headers.get('user-agent') || undefined;
    // Note: In production, you'd get country from a geo-IP service or CDN header
    const country = request.headers.get('cf-ipcountry') || // Cloudflare
                    request.headers.get('x-vercel-ip-country') || // Vercel
                    undefined;

    // Log the event
    const success = await logClientEvent({
      type: type as EventType,
      anonId,
      ventureId,
      clipId,
      questionSlug,
      meta,
      session,
      ua,
      country,
      referrer,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Event not logged' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch endpoint for multiple events at once
const batchTrackSchema = z.object({
  events: z.array(trackEventSchema).max(20), // Max 20 events per batch
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = batchTrackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { events } = parsed.data;
    const ua = request.headers.get('user-agent') || undefined;
    const country = request.headers.get('cf-ipcountry') ||
                    request.headers.get('x-vercel-ip-country') ||
                    undefined;

    // Check rate limit for first event's anonId
    const firstAnonId = events[0]?.anonId;
    if (firstAnonId && !checkRateLimit(firstAnonId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Log all valid events
    let logged = 0;
    for (const event of events) {
      if (isValidEventType(event.type) && isClientEventType(event.type)) {
        await logClientEvent({
          type: event.type as EventType,
          anonId: event.anonId,
          ventureId: event.ventureId,
          clipId: event.clipId,
          questionSlug: event.questionSlug,
          meta: event.meta,
          session: event.session,
          ua,
          country,
          referrer: event.referrer,
        });
        logged++;
      }
    }

    return NextResponse.json({ ok: true, logged });
  } catch (error) {
    console.error('Batch track API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
