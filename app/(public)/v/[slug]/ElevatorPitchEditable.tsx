'use client';

import { useRouter } from 'next/navigation';
import { InlineEdit } from '@/components/ui';

interface ElevatorPitchEditableProps {
  ventureId: string;
  pitch: string;
  problem?: string | null;
  who?: string | null;
  isOwner: boolean;
}

export function ElevatorPitchEditable({
  ventureId,
  pitch,
  problem,
  who,
  isOwner,
}: ElevatorPitchEditableProps) {
  const router = useRouter();

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

  return (
    <>
      {/* Pitch */}
      <InlineEdit
        value={pitch}
        onSave={(value) => handleSave('pitch', value)}
        isOwner={isOwner}
        type="textarea"
        placeholder="Describe your venture in one sentence..."
        maxLength={300}
        className="mb-4"
      >
        <p className="text-[18px] sm:text-[22px] font-semibold text-ink leading-snug">
          {pitch || (isOwner && <span className="text-ink-3 italic">Add your pitch...</span>)}
        </p>
      </InlineEdit>

      {/* Problem */}
      {(problem || isOwner) && (
        <InlineEdit
          value={problem || ''}
          onSave={(value) => handleSave('problem', value)}
          isOwner={isOwner}
          type="textarea"
          placeholder="What problem are you solving?"
          maxLength={1000}
          className="mb-2"
        >
          <div className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed">
            <span className="font-semibold text-ink">The problem:</span>{' '}
            {problem || (isOwner && <span className="text-ink-3 italic">Click to add...</span>)}
          </div>
        </InlineEdit>
      )}

      {/* Who */}
      {(who || isOwner) && (
        <InlineEdit
          value={who || ''}
          onSave={(value) => handleSave('who', value)}
          isOwner={isOwner}
          type="text"
          placeholder="Who is this for?"
          maxLength={500}
        >
          <div className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed">
            <span className="font-semibold text-ink">For:</span>{' '}
            {who || (isOwner && <span className="text-ink-3 italic">Click to add...</span>)}
          </div>
        </InlineEdit>
      )}
    </>
  );
}
