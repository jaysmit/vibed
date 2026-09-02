import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';
import type { Rung, SegmentKey } from '@/lib/domain/rungs';
import type { Founder, Industry } from '@/lib/supabase/types';

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
  pitch?: string;
  industry?: Industry;
  country?: string | null;
  categories?: Industry[];
  founderName?: string;
  founderBio?: string;
  founderLocation?: string;
}

export interface UpdateVentureInput {
  name?: string;
  pitch?: string;
  industry?: Industry;
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
  happenedAt?: string; // ISO date when this actually happened
}

export async function createVenture(input: CreateVentureInput) {
  const supabase = await createAdminClient();

  const { userId, name, pitch, founderName, founderBio, founderLocation, country, categories } = input;

  // Check if user already has a founder profile
  let { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Create founder profile if doesn't exist and founderName is provided
  if (!founder && founderName) {
    const baseSlug = generateSlug(founderName);
    let founderSlug = baseSlug;
    let counter = 1;

    // Ensure unique founder slug
    while (true) {
      const { data: existing } = await supabase
        .from('founders')
        .select('id')
        .eq('slug', founderSlug)
        .single();

      if (!existing) break;
      founderSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { data: newFounder, error: founderError } = await supabase
      .from('founders')
      .insert({
        user_id: userId,
        name: founderName,
        slug: founderSlug,
        bio: founderBio || '',
        location: founderLocation || '',
        links: {},
      })
      .select()
      .single();

    if (founderError || !newFounder) {
      throw new Error(`Failed to create founder: ${founderError?.message}`);
    }

    founder = newFounder;
  }

  if (!founder) {
    throw new Error('Founder profile required. Please create one first.');
  }

  // Create venture
  const ventureBaseSlug = generateSlug(name);
  let ventureSlug = ventureBaseSlug;
  let ventureCounter = 1;

  // Ensure unique venture slug
  while (true) {
    const { data: existing } = await supabase
      .from('ventures')
      .select('id')
      .eq('slug', ventureSlug)
      .single();

    if (!existing) break;
    ventureSlug = `${ventureBaseSlug}-${ventureCounter}`;
    ventureCounter++;
  }

  // Build venture data with all fields
  const ventureData: Record<string, unknown> = {
    slug: ventureSlug,
    founder_id: founder.id,
    name,
    pitch: pitch || '',
    brand: generateBrandColor(),
    glyph: 'wave',
    rung: 'idea',
    status: 'draft',
    links: {},
    segments: {},
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
  };

  // Add optional fields
  if (input.industry) {
    ventureData.industry = input.industry;
  }
  if (country) {
    ventureData.country = country;
  }
  if (categories && categories.length > 0) {
    ventureData.categories = categories;
  }

  // Try to insert with all fields first
  let { data: venture, error: ventureError } = await supabase
    .from('ventures')
    .insert(ventureData)
    .select()
    .single();

  // If insert fails due to missing columns, retry without new fields
  if (ventureError?.message?.includes('column')) {
    // Remove potentially missing columns and retry
    delete ventureData.country;
    delete ventureData.categories;
    delete ventureData.industry;

    const retryResult = await supabase
      .from('ventures')
      .insert(ventureData)
      .select()
      .single();

    venture = retryResult.data;
    ventureError = retryResult.error;
  }

  if (ventureError || !venture) {
    throw new Error(`Failed to create venture: ${ventureError?.message}`);
  }

  // Log event
  await logEvent({
    type: EVENT_TYPES.VENTURE_CREATED,
    actorId: userId,
    ventureId: venture.id,
    meta: { slug: ventureSlug },
  });

  return {
    ventureId: venture.id,
    ventureSlug: venture.slug,
    founderId: founder.id,
    founderSlug: founder.slug,
  };
}

export async function getVentureForEdit(ventureId: string, userId: string) {
  const supabase = await createAdminClient();

  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('id', ventureId)
    .single();

  if (!venture) return null;

  // Verify ownership
  const founder = venture.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return null;
  }

  return {
    ...venture,
    _id: venture.id,
    founderId: venture.founder_id,
  };
}

export async function getVentureByFounderUserId(userId: string) {
  const supabase = await createAdminClient();

  const { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!founder) return null;

  const { data: venture } = await supabase
    .from('ventures')
    .select('*')
    .eq('founder_id', founder.id)
    .single();

  if (!venture) return null;

  return {
    ...venture,
    _id: venture.id,
    founderId: venture.founder_id,
    founder: {
      name: founder.name,
      slug: founder.slug,
      bio: founder.bio,
      location: founder.location,
    },
  };
}

export async function getVenturesByFounderUserId(userId: string) {
  const supabase = await createAdminClient();

  const { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!founder) return [];

  const { data: ventures } = await supabase
    .from('ventures')
    .select('*')
    .eq('founder_id', founder.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (!ventures || ventures.length === 0) return [];

  return ventures.map((venture) => ({
    ...venture,
    _id: venture.id,
    founderId: venture.founder_id,
    founder: {
      name: founder.name,
      slug: founder.slug,
      bio: founder.bio,
      location: founder.location,
    },
  }));
}

export async function updateVenture(
  ventureId: string,
  userId: string,
  updates: UpdateVentureInput
) {
  const supabase = await createAdminClient();

  // Get venture and verify ownership
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('id', ventureId)
    .single();

  if (!venture) return null;

  const founder = venture.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return null;
  }

  // Apply updates
  const { error } = await supabase
    .from('ventures')
    .update(updates)
    .eq('id', ventureId);

  if (error) {
    throw new Error(`Failed to update venture: ${error.message}`);
  }

  return { success: true };
}

export async function updateSegment(
  ventureId: string,
  userId: string,
  segmentKey: SegmentKey,
  input: UpdateSegmentInput
) {
  const supabase = await createAdminClient();

  // Get venture and verify ownership
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('id', ventureId)
    .single();

  if (!venture) return null;

  const founder = venture.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return null;
  }

  const segments = (venture.segments || {}) as Record<string, { body?: string; happenedAt?: string; publishedAt?: string; updatedAt?: string }>;
  const isNew = !segments[segmentKey]?.body;

  // Update segment with flexible timeline support
  // happenedAt: when this actually happened (defaults to today for new entries)
  // publishedAt: when founder first published this content
  // updatedAt: when founder last edited this
  segments[segmentKey] = {
    body: input.body,
    happenedAt: input.happenedAt || segments[segmentKey]?.happenedAt || new Date().toISOString().split('T')[0],
    publishedAt: segments[segmentKey]?.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('ventures')
    .update({ segments })
    .eq('id', ventureId);

  if (error) {
    throw new Error(`Failed to update segment: ${error.message}`);
  }

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
  const supabase = await createAdminClient();

  // Get venture and verify ownership
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('id', ventureId)
    .single();

  if (!venture) return null;

  const founder = venture.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return null;
  }

  if (venture.status !== 'draft') {
    return { success: true, alreadyPublished: true };
  }

  const { error } = await supabase
    .from('ventures')
    .update({
      status: 'live',
      published_at: new Date().toISOString(),
    })
    .eq('id', ventureId);

  if (error) {
    throw new Error(`Failed to publish venture: ${error.message}`);
  }

  await logEvent({
    type: EVENT_TYPES.VENTURE_PUBLISHED,
    actorId: userId,
    ventureId: ventureId,
    meta: { slug: venture.slug },
  });

  return { success: true };
}

export async function updateRung(ventureId: string, userId: string, rung: Rung) {
  const supabase = await createAdminClient();

  // Get venture and verify ownership
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('id', ventureId)
    .single();

  if (!venture) return null;

  const founder = venture.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return null;
  }

  const oldRung = venture.rung;

  const { error } = await supabase
    .from('ventures')
    .update({ rung })
    .eq('id', ventureId);

  if (error) {
    throw new Error(`Failed to update rung: ${error.message}`);
  }

  await logEvent({
    type: EVENT_TYPES.VENTURE_RUNG_CHANGED,
    actorId: userId,
    ventureId: ventureId,
    meta: { from: oldRung, to: rung },
  });

  return { success: true };
}

// ============================================
// PROMISE MANAGEMENT
// ============================================

export interface CreatePromiseInput {
  text: string;
  dueAt: string; // ISO date
}

export interface PromiseRecord {
  text: string;
  dueAt: string;
  createdAt: string;
  kept?: boolean;
  completedAt?: string;
}

export async function createPromise(
  ventureId: string,
  userId: string,
  input: CreatePromiseInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  // Get venture and verify ownership
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('id', ventureId)
    .single();

  if (!venture) return { success: false, error: 'Venture not found' };

  const founder = venture.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return { success: false, error: 'Not authorized' };
  }

  // If there's an existing promise, move it to history as uncompleted
  const promiseHistory = (venture.promise_history || []) as PromiseRecord[];
  if (venture.promise && (venture.promise as PromiseRecord).text) {
    const oldPromise = venture.promise as PromiseRecord;
    promiseHistory.push({
      ...oldPromise,
      kept: false, // Overwritten promise counts as not kept
      completedAt: new Date().toISOString(),
    });
  }

  // Create new promise
  const newPromise: PromiseRecord = {
    text: input.text,
    dueAt: input.dueAt,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('ventures')
    .update({
      promise: newPromise,
      promise_history: promiseHistory,
    })
    .eq('id', ventureId);

  if (error) {
    throw new Error(`Failed to create promise: ${error.message}`);
  }

  await logEvent({
    type: EVENT_TYPES.PROMISE_CREATED,
    actorId: userId,
    ventureId: ventureId,
    meta: { text: input.text, dueAt: input.dueAt },
  });

  return { success: true };
}

export async function completePromise(
  ventureId: string,
  userId: string,
  kept: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  // Get venture and verify ownership
  const { data: venture } = await supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('id', ventureId)
    .single();

  if (!venture) return { success: false, error: 'Venture not found' };

  const founder = venture.founders as Founder;
  if (!founder || founder.user_id !== userId) {
    return { success: false, error: 'Not authorized' };
  }

  if (!venture.promise || !(venture.promise as PromiseRecord).text) {
    return { success: false, error: 'No active promise' };
  }

  const currentPromise = venture.promise as PromiseRecord;
  const promiseHistory = (venture.promise_history || []) as PromiseRecord[];

  // Move current promise to history with completion status
  promiseHistory.push({
    ...currentPromise,
    kept,
    completedAt: new Date().toISOString(),
  });

  // Clear active promise
  const { error } = await supabase
    .from('ventures')
    .update({
      promise: null,
      promise_history: promiseHistory,
    })
    .eq('id', ventureId);

  if (error) {
    throw new Error(`Failed to complete promise: ${error.message}`);
  }

  await logEvent({
    type: kept ? EVENT_TYPES.PROMISE_KEPT : EVENT_TYPES.PROMISE_BROKEN,
    actorId: userId,
    ventureId: ventureId,
    meta: { text: currentPromise.text, kept },
  });

  return { success: true };
}
