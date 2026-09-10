import { type Rung, RUNGS } from '@/lib/domain/rungs';

interface RungLadderProps {
  rung: Rung;
  isDead?: boolean;
  className?: string;
}

const rungIndex = (r: Rung) => RUNGS.indexOf(r);

// Heights for each bar (6 bars total)
const barHeights = [4, 6, 8, 10, 11.5, 13];

export function RungLadder({ rung, isDead = false, className = '' }: RungLadderProps) {
  const currentIndex = rungIndex(rung);
  // Map rung index (0-5) to number of filled bars (1-6)
  // idea=1, building=2, live=3, first=4, growing=5, alumni=6
  const filledBars = currentIndex + 1;

  return (
    <div className={`flex gap-[3px] items-end h-[13px] ${className}`}>
      {barHeights.map((height, i) => {
        const isFilled = i < filledBars;
        const isCash = i >= 3; // bars 4-6 represent money stages

        let bgColor = 'bg-rule-2';
        if (isFilled) {
          if (isDead) {
            bgColor = 'bg-dead';
          } else if (isCash) {
            bgColor = 'bg-go';
          } else {
            bgColor = 'bg-ink';
          }
        }

        return (
          <b
            key={i}
            className={`block w-[9px] rounded-[1px] ${bgColor}`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}

// Rung label lookup
const RUNG_LABELS: Record<Rung, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  first: 'First dollar',
  growing: 'Growing',
  alumni: 'Alumni',
};

interface RungTagProps {
  rung: Rung;
  isDead?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export function RungTag({ rung, isDead = false, size = 'md' }: RungTagProps) {
  if (size === 'xs') {
    // Extra small - subtle, just the ladder icon with minimal styling
    return (
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded px-1.5 py-0.5">
        <RungLadder rung={rung} isDead={isDead} className="scale-[0.65]" />
        <span className="text-[8px] font-medium text-ink-3 uppercase tracking-wide">
          {RUNG_LABELS[rung]}
        </span>
      </div>
    );
  }

  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center bg-white/95 backdrop-blur-sm rounded-full shadow-sm ${
      isSmall ? 'gap-1.5 px-2 py-1' : 'gap-2 px-[11px] py-1.5'
    }`}>
      <RungLadder rung={rung} isDead={isDead} className={isSmall ? 'scale-[0.8]' : ''} />
      <span className={`font-semibold tracking-wide uppercase text-ink-2 ${
        isSmall ? 'text-[9px]' : 'text-[11px]'
      }`}>
        {RUNG_LABELS[rung]}
      </span>
    </div>
  );
}
