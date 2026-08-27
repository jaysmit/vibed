// Rungs - the journey stages (client-safe, no Mongoose dependency)
export const RUNGS = ['idea', 'building', 'live', 'first', 'growing', 'alumni'] as const;
export type Rung = typeof RUNGS[number];

// Segment keys - the 16 fixed journey segments
export const SEGMENT_KEYS = [
  'pitch', 'spark', 'validation', 'audience', 'proto', 'build', 'beta', 'gtm',
  'launch', 'first', 'channel', 'trouble', 'money', 'team', 'scale', 'next'
] as const;
export type SegmentKey = typeof SEGMENT_KEYS[number];
