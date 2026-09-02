'use client';

import { useState } from 'react';
import { ProgressRingCompact } from './ProgressRing';
import { CompletionChecklist } from './CompletionChecklist';
import type { PublishingRequirements } from '@/lib/domain/standards';

interface VentureCompletionControlsProps {
  ventureId: string;
  ventureSlug: string;
  percentage: number;
  requirements: PublishingRequirements;
  status: 'draft' | 'live' | 'graduated' | 'closed';
}

export function VentureCompletionControls({
  ventureId,
  ventureSlug,
  percentage,
  requirements,
  status,
}: VentureCompletionControlsProps) {
  const [showChecklist, setShowChecklist] = useState(false);

  const isComplete = percentage >= 100;
  const isPublished = status === 'live';

  return (
    <>
      {/* Progress Ring - clickable */}
      <button
        onClick={() => setShowChecklist(true)}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <ProgressRingCompact percentage={percentage} />
      </button>

      {/* Publish Button */}
      {status === 'draft' && (
        <button
          onClick={() => setShowChecklist(true)}
          className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors ${
            isComplete
              ? 'bg-go text-[#00301E] hover:bg-[#04B76B]'
              : 'bg-rule text-ink-2 hover:bg-rule-2'
          }`}
        >
          {isComplete ? (
            'Publish Venture'
          ) : (
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Complete to publish
            </span>
          )}
        </button>
      )}

      {/* Published badge */}
      {isPublished && (
        <div className="flex items-center gap-2 px-4 py-2 bg-go-tint text-go-deep rounded-full text-[13px] font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Published
        </div>
      )}

      {/* Modal */}
      {showChecklist && (
        <CompletionChecklist
          ventureId={ventureId}
          ventureSlug={ventureSlug}
          percentage={percentage}
          requirements={requirements}
          status={status}
          onClose={() => setShowChecklist(false)}
        />
      )}
    </>
  );
}
