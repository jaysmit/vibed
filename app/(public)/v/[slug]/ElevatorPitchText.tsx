'use client';

import { useState } from 'react';

interface ElevatorPitchTextProps {
  pitch?: string | null;
  problem?: string | null;
  who?: string | null;
}

export function ElevatorPitchText({ pitch, problem, who }: ElevatorPitchTextProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate if content is long enough to need expansion
  const totalLength = (pitch?.length || 0) + (problem?.length || 0) + (who?.length || 0);
  const needsExpansion = totalLength > 200;

  return (
    <div className={`relative ${!expanded && needsExpansion ? 'max-h-[120px] overflow-hidden' : ''}`}>
      {pitch && (
        <p className="text-[15px] font-semibold text-ink leading-snug mb-2">
          {pitch}
        </p>
      )}
      {problem && (
        <div className="text-[13px] text-ink-2 leading-relaxed">
          <span className="font-semibold text-ink">The problem:</span> {problem}
        </div>
      )}
      {who && (
        <div className="text-[13px] text-ink-2 leading-relaxed mt-1">
          <span className="font-semibold text-ink">For:</span> {who}
        </div>
      )}

      {/* Gradient overlay and view more button */}
      {needsExpansion && !expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-soft to-transparent flex items-end justify-center pb-1">
          <button
            onClick={() => setExpanded(true)}
            className="text-[11px] font-semibold text-go-deep hover:underline bg-soft px-2 py-0.5 rounded"
          >
            View more
          </button>
        </div>
      )}

      {needsExpansion && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="text-[11px] font-semibold text-ink-3 hover:text-ink mt-2"
        >
          Show less
        </button>
      )}
    </div>
  );
}
