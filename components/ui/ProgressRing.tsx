'use client';

import { getProgressColor } from '@/lib/domain/standards';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 44,
  strokeWidth = 4,
  showText = true,
  className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getProgressColor(percentage);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-rule"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {showText && (
        <span
          className="absolute text-[11px] font-bold tabular-nums"
          style={{ color }}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
}

// Compact version for header
interface ProgressRingCompactProps {
  percentage: number;
  className?: string;
}

export function ProgressRingCompact({ percentage, className = '' }: ProgressRingCompactProps) {
  const color = getProgressColor(percentage);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
      style={{ backgroundColor: `${color}15` }}
    >
      <ProgressRing percentage={percentage} size={28} strokeWidth={3} showText={false} />
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color }}
      >
        {percentage}%
      </span>
    </div>
  );
}
