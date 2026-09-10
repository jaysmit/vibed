// Standards and completion calculation for ventures

import type { Venture } from '@/lib/supabase/types';

// Publishing requirements - split into basics and journey
export interface PublishingRequirements {
  // Basics (from the basics tab)
  hasName: boolean;
  hasPitch: boolean;           // One-line pitch
  hasCoverImage: boolean;      // Hero/banner image

  // Journey essentials
  hasElevatorPitch: boolean;   // The pitch segment written
  hasSparkStory: boolean;      // The spark segment written

  // Optional but tracked
  hasPitchVideo: boolean;      // Elevator pitch video
}

// Additional segments that are recommended based on venture stage
export interface StageRequirements {
  hasValidation: boolean;
  hasPrototype: boolean;
  hasBuild: boolean;
  hasLaunch: boolean;
  hasFirstDollar: boolean;
}

export interface CompletionStatus {
  requirements: PublishingRequirements;
  stageRequirements: StageRequirements;
  completedCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
  recommendations: string[];
}

// Core requirements needed to publish (5 items = 100%)
const CORE_REQUIREMENTS: (keyof PublishingRequirements)[] = [
  'hasName',
  'hasPitch',
  'hasCoverImage',
  'hasElevatorPitch',
  'hasSparkStory',
];

// Calculate completion status for a venture
export function calculateCompletion(venture: Partial<Venture>): CompletionStatus {
  const segments = venture.segments || {};
  const links = venture.links || {};

  // All requirements
  const requirements: PublishingRequirements = {
    // Basics
    hasName: Boolean(venture.name?.trim()),
    hasPitch: Boolean(venture.pitch?.trim()),
    hasCoverImage: Boolean(links.poster),

    // Journey essentials
    hasElevatorPitch: Boolean(segments.pitch?.body?.trim()),
    hasSparkStory: Boolean(segments.spark?.body?.trim()),

    // Optional
    hasPitchVideo: false, // Will be set from clips data if available
  };

  // Stage-based requirements (not required for publishing but tracked)
  const stageRequirements: StageRequirements = {
    hasValidation: Boolean(segments.validation?.body?.trim()),
    hasPrototype: Boolean(segments.proto?.body?.trim()),
    hasBuild: Boolean(segments.build?.body?.trim()),
    hasLaunch: Boolean(segments.launch?.body?.trim()),
    hasFirstDollar: Boolean(segments.first?.body?.trim()),
  };

  // Count core requirements (excluding video which is optional)
  const coreComplete = CORE_REQUIREMENTS.filter(key => requirements[key]).length;
  const totalCount = CORE_REQUIREMENTS.length;

  const percentage = Math.round((coreComplete / totalCount) * 100);
  const isComplete = coreComplete === totalCount;

  // Generate recommendations
  const recommendations: string[] = [];
  if (!requirements.hasPitchVideo) {
    recommendations.push('Add a 30-60 second pitch video to bring your story to life');
  }
  if (isComplete && !stageRequirements.hasValidation) {
    recommendations.push('Share how you\'re validating your idea - the community can help!');
  }

  return {
    requirements,
    stageRequirements,
    completedCount: coreComplete,
    totalCount,
    percentage,
    isComplete,
    recommendations,
  };
}

// Get requirement labels for display
export const REQUIREMENT_LABELS: Record<keyof PublishingRequirements, string> = {
  hasName: 'Venture name',
  hasPitch: 'One-line pitch',
  hasCoverImage: 'Cover image',
  hasElevatorPitch: 'Elevator pitch story',
  hasSparkStory: 'Your spark story',
  hasPitchVideo: 'Pitch video',
};

export const REQUIREMENT_ACTIONS: Record<keyof PublishingRequirements, { action: string; field: string }> = {
  hasName: { action: 'Give your venture a name', field: 'name' },
  hasPitch: { action: 'Write a one-line pitch', field: 'pitch' },
  hasCoverImage: { action: 'Upload a cover image', field: 'poster' },
  hasElevatorPitch: { action: 'Explain what you\'re building', field: 'pitch' },
  hasSparkStory: { action: 'Tell us what made you start', field: 'spark' },
  hasPitchVideo: { action: 'Record a 30-60 second pitch', field: 'pitch-video' },
};

// Stage requirement labels
export const STAGE_LABELS: Record<keyof StageRequirements, string> = {
  hasValidation: 'Validation',
  hasPrototype: 'First Prototype',
  hasBuild: 'The Build',
  hasLaunch: 'Launch',
  hasFirstDollar: 'First Dollar',
};

// Get color based on progress percentage
export function getProgressColor(percentage: number): string {
  if (percentage < 25) return '#B03A28';      // dead/red
  if (percentage < 50) return '#B7791F';      // warn/orange
  if (percentage < 75) return '#DAA520';      // yellow/goldenrod
  return '#05CE78';                            // go/green
}

// Get color class based on progress percentage (for Tailwind)
export function getProgressColorClass(percentage: number): {
  bg: string;
  text: string;
  ring: string;
} {
  if (percentage < 25) {
    return { bg: 'bg-dead', text: 'text-dead', ring: 'ring-dead/20' };
  }
  if (percentage < 50) {
    return { bg: 'bg-warn', text: 'text-warn', ring: 'ring-warn/20' };
  }
  if (percentage < 75) {
    return { bg: 'bg-[#DAA520]', text: 'text-[#DAA520]', ring: 'ring-[#DAA520]/20' };
  }
  return { bg: 'bg-go', text: 'text-go', ring: 'ring-go/20' };
}
