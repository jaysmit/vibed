import { RUNGS, type Rung } from '@/lib/domain/rungs';

const RUNG_LABELS: Record<Rung, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  first: 'First $',
  growing: 'Growing',
  alumni: 'Alumni',
};

interface TimelineProgressProps {
  currentRung: Rung;
  completedSegments: number;
  totalSegments: number;
  className?: string;
}

export function TimelineProgress({
  currentRung,
  completedSegments,
  totalSegments,
  className = '',
}: TimelineProgressProps) {
  const currentIndex = RUNGS.indexOf(currentRung);
  const progressPercent = Math.round((completedSegments / totalSegments) * 100);

  return (
    <div className={`${className}`}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 bg-rule rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-go to-go-deep rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[12px] font-mono font-semibold text-ink-2">
          {progressPercent}%
        </span>
      </div>

      {/* Stage dots */}
      <div className="flex justify-between items-center relative">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-rule" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-go transition-all duration-500"
          style={{ width: `${(currentIndex / (RUNGS.length - 1)) * 100}%` }}
        />

        {RUNGS.map((rung, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={rung} className="relative flex flex-col items-center z-10">
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  isPast
                    ? 'bg-go border-go'
                    : isCurrent
                    ? 'bg-page border-go ring-4 ring-go/20'
                    : 'bg-page border-rule'
                }`}
              >
                {isPast && (
                  <svg
                    className="w-full h-full text-white p-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`absolute top-6 text-[10px] font-medium whitespace-nowrap ${
                  isCurrent ? 'text-go-deep font-bold' : isPast ? 'text-ink-2' : 'text-ink-3'
                }`}
              >
                {RUNG_LABELS[rung]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
