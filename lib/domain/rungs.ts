// Rungs - the journey stages (client-safe, no Mongoose dependency)
export const RUNGS = ['idea', 'building', 'live', 'first', 'growing', 'now'] as const;
export type Rung = typeof RUNGS[number];

// Segment keys - fixed journey segments displayed in timeline + pitch (pinned to header)
// Note: 'pitch' is stored but not shown in the journey timeline (it's in the Elevator Pitch section)
export const SEGMENT_KEYS = [
  'pitch',           // Elevator Pitch (pinned to header, not in timeline)
  // Idea stage
  'spark',           // Idea
  'validation',      // Idea
  // Building stage
  'proto',           // Building
  'audience',        // Building
  'build',           // Building
  'beta',            // Building
  'gtm',             // Building
  // Live stage
  'launch',          // Live
  'firstuser',       // Live
  // First Dollar stage
  'first',           // First Dollar
  'channel',         // First Dollar
  // Growing stage
  'trouble',         // Growing
  'money',           // Growing
  'team',            // Growing
  'retention',       // Growing
  // Now stage
  'next',            // Now
  // Universal segments (can happen at any stage)
  'pivot',           // Universal
  'shutdown',        // Universal
] as const;
export type SegmentKey = typeof SEGMENT_KEYS[number];

// Segments that appear in the journey timeline (excludes pitch which is pinned to header)
export const TIMELINE_SEGMENT_KEYS = SEGMENT_KEYS.filter(k => k !== 'pitch') as readonly Exclude<SegmentKey, 'pitch'>[];

// Universal segments - can happen at any stage of the journey
export const UNIVERSAL_SEGMENT_KEYS = ['pivot', 'shutdown'] as const;
export type UniversalSegmentKey = typeof UNIVERSAL_SEGMENT_KEYS[number];
