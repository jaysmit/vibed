// Pillar definitions and segment mapping for the landing page
// Used for categorizing clips into the 4 main content pillars

import type { Pillar } from '@/lib/supabase/types';
import { PILLAR_SEGMENTS, PILLAR_LABELS, PILLAR_DESCRIPTIONS } from '@/lib/supabase/types';

export { PILLAR_SEGMENTS, PILLAR_LABELS, PILLAR_DESCRIPTIONS };
export type { Pillar };

/**
 * Get the pillar a segment belongs to
 */
export function getPillarForSegment(segmentKey: string): Exclude<Pillar, 'featured'> | null {
  for (const [pillar, segments] of Object.entries(PILLAR_SEGMENTS)) {
    if (segments.includes(segmentKey)) {
      return pillar as Exclude<Pillar, 'featured'>;
    }
  }
  return null;
}

/**
 * Check if a segment belongs to a specific pillar
 */
export function isSegmentInPillar(segmentKey: string, pillar: Exclude<Pillar, 'featured'>): boolean {
  return PILLAR_SEGMENTS[pillar].includes(segmentKey);
}

/**
 * Get all segments for a pillar
 */
export function getSegmentsForPillar(pillar: Exclude<Pillar, 'featured'>): string[] {
  return PILLAR_SEGMENTS[pillar];
}

/**
 * Landing page pillar order (for rendering)
 */
export const PILLAR_ORDER: Exclude<Pillar, 'featured'>[] = [
  'the_idea',
  'building_it',
  'getting_customers',
  'hard_parts',
];
