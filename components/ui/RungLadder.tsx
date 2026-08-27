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

export function RungTag({ rung, isDead = false }: { rung: Rung; isDead?: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-[11px] py-1.5 shadow-sm">
      <RungLadder rung={rung} isDead={isDead} />
      <span className="text-[11px] font-semibold tracking-wide uppercase text-ink-2">
        {RUNG_LABELS[rung]}
      </span>
    </div>
  );
}
