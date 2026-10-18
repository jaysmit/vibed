'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InlineEdit } from '@/components/ui';

interface ElevatorPitchEditableProps {
  ventureId: string;
  pitch: string;
  elevatorPitch?: string | null;
  isOwner: boolean;
}

const MAX_COLLAPSED_LENGTH = 300;

export function ElevatorPitchEditable({
  ventureId,
  pitch,
  elevatorPitch,
  isOwner,
}: ElevatorPitchEditableProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const handleSave = async (field: string, value: string) => {
    const res = await fetch(`/api/ventures/${ventureId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });

    if (!res.ok) {
      throw new Error('Failed to save');
    }

    router.refresh();
  };

  const needsExpansion = elevatorPitch && elevatorPitch.length > MAX_COLLAPSED_LENGTH;
  const displayText = elevatorPitch && !expanded && needsExpansion
    ? elevatorPitch.slice(0, MAX_COLLAPSED_LENGTH).trimEnd() + '...'
    : elevatorPitch;

  return (
    <div className="space-y-4">
      {/* One-line tagline */}
      <InlineEdit
        value={pitch}
        onSave={(value) => handleSave('pitch', value)}
        isOwner={isOwner}
        type="textarea"
        placeholder="Your one-line pitch..."
        maxLength={300}
      >
        <p className="text-[18px] sm:text-[22px] font-semibold text-ink leading-snug">
          {pitch || (isOwner && <span className="text-ink-3 italic">Add your pitch...</span>)}
        </p>
      </InlineEdit>

      {/* Full elevator pitch */}
      {(elevatorPitch || isOwner) && (
        <div>
          <InlineEdit
            value={elevatorPitch || ''}
            onSave={(value) => handleSave('problem', value)}
            isOwner={isOwner}
            type="textarea"
            placeholder="Your full elevator pitch - explain the problem, your solution, and why people should care..."
            maxLength={2000}
          >
            <div className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed whitespace-pre-wrap">
              {displayText || (isOwner && <span className="text-ink-3 italic">Add your elevator pitch...</span>)}
            </div>
          </InlineEdit>
          {needsExpansion && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[13px] font-medium text-go-deep hover:underline"
            >
              {expanded ? 'Show less' : 'See more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
