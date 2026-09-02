// Standards and completion calculation for ventures

import type { Venture, Industry } from '@/lib/supabase/types';

// Publishing requirements (7 items = 100%)
export interface PublishingRequirements {
  hasName: boolean;
  hasPitch: boolean;
  hasCategory: boolean;
  hasCountry: boolean;
  hasProblem: boolean;
  hasWho: boolean;
  hasWhy: boolean;
}

export interface CompletionStatus {
  requirements: PublishingRequirements;
  completedCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
}

// Calculate completion status for a venture
export function calculateCompletion(venture: Partial<Venture>): CompletionStatus {
  const requirements: PublishingRequirements = {
    hasName: Boolean(venture.name && venture.name.trim()),
    hasPitch: Boolean(venture.pitch && venture.pitch.trim()),
    hasCategory: Boolean(
      (venture.categories && venture.categories.length > 0) ||
      (venture.industry && venture.industry !== 'other')
    ),
    hasCountry: Boolean(venture.country && venture.country.trim()),
    hasProblem: Boolean(venture.problem && venture.problem.trim()),
    hasWho: Boolean(venture.who && venture.who.trim()),
    hasWhy: Boolean(venture.why && venture.why.trim()),
  };

  const completedCount = Object.values(requirements).filter(Boolean).length;
  const totalCount = Object.keys(requirements).length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    requirements,
    completedCount,
    totalCount,
    percentage,
    isComplete: completedCount === totalCount,
  };
}

// Get requirement labels
export const REQUIREMENT_LABELS: Record<keyof PublishingRequirements, string> = {
  hasName: 'Venture name',
  hasPitch: 'One-line pitch',
  hasCategory: 'At least 1 category',
  hasCountry: 'Country/location',
  hasProblem: 'Problem statement',
  hasWho: 'Who it\'s for',
  hasWhy: 'Why them',
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
