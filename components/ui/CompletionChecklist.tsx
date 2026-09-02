'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { REQUIREMENT_LABELS, type PublishingRequirements } from '@/lib/domain/standards';

interface CompletionChecklistProps {
  ventureId: string;
  ventureSlug: string;
  percentage: number;
  requirements: PublishingRequirements;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  onClose: () => void;
}

const REQUIREMENT_ACTIONS: Record<keyof PublishingRequirements, { action: string; tab?: string }> = {
  hasName: { action: 'Edit venture name', tab: 'basics' },
  hasPitch: { action: 'Write a one-line pitch', tab: 'basics' },
  hasCategory: { action: 'Select categories', tab: 'basics' },
  hasCountry: { action: 'Set your location', tab: 'basics' },
  hasProblem: { action: 'Describe the problem', tab: 'basics' },
  hasWho: { action: 'Define your target audience', tab: 'basics' },
  hasWhy: { action: 'Explain why them', tab: 'basics' },
};

export function CompletionChecklist({
  ventureId,
  ventureSlug,
  percentage,
  requirements,
  status,
  onClose,
}: CompletionChecklistProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

  const isComplete = percentage >= 100;
  const isPublished = status === 'live';

  const handlePublish = async () => {
    if (!isComplete) return;

    setIsPublishing(true);
    try {
      await fetch(`/api/ventures/${ventureId}/publish`, {
        method: 'POST',
      });
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Failed to publish:', error);
    }
    setIsPublishing(false);
  };

  const allRequirements = Object.entries(requirements) as [keyof PublishingRequirements, boolean][];

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-page rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-rule">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold">Complete Your Venture</h2>
            <button
              onClick={onClose}
              className="text-ink-3 hover:text-ink p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-[14px] text-ink-2 mt-2">
            {isComplete
              ? 'Your venture is ready to publish!'
              : `${percentage}% complete — finish these items to publish your venture.`}
          </p>
        </div>

        {/* Checklist */}
        <div className="p-6 space-y-3">
          {allRequirements.map(([key, met]) => (
            <div
              key={key}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                met ? 'bg-go-tint' : 'bg-soft'
              }`}
            >
              {met ? (
                <div className="w-6 h-6 rounded-full bg-go flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-ink-3" />
              )}
              <div className="flex-1">
                <div className={`text-[14px] font-medium ${met ? 'text-go-deep' : 'text-ink'}`}>
                  {REQUIREMENT_LABELS[key]}
                </div>
                {!met && (
                  <div className="text-[12px] text-ink-3">
                    {REQUIREMENT_ACTIONS[key].action}
                  </div>
                )}
              </div>
              {!met && (
                <Link
                  href={`/v/${ventureSlug}/edit`}
                  className="text-[12px] font-semibold text-go-deep hover:underline"
                  onClick={onClose}
                >
                  Add →
                </Link>
              )}
            </div>
          ))}

          {/* Additional items (non-required but recommended) */}
          <div className="pt-4 mt-4 border-t border-rule">
            <h3 className="text-[13px] font-semibold text-ink-3 mb-3">RECOMMENDED</h3>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-soft">
              <div className="w-6 h-6 rounded-full border-2 border-ink-3 border-dashed" />
              <div className="flex-1">
                <div className="text-[14px] font-medium text-ink">Elevator pitch video</div>
                <div className="text-[12px] text-ink-3">Record a 30-60 second pitch</div>
              </div>
              <Link
                href={`/v/${ventureSlug}/edit`}
                className="text-[12px] font-semibold text-go-deep hover:underline"
                onClick={onClose}
              >
                Upload →
              </Link>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-soft mt-2">
              <div className="w-6 h-6 rounded-full border-2 border-ink-3 border-dashed" />
              <div className="flex-1">
                <div className="text-[14px] font-medium text-ink">Venture logo</div>
                <div className="text-[12px] text-ink-3">Upload a logo or pick an emoji</div>
              </div>
              <Link
                href={`/v/${ventureSlug}/edit`}
                className="text-[12px] font-semibold text-go-deep hover:underline"
                onClick={onClose}
              >
                Edit →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-rule bg-soft/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 border border-rule rounded-full text-[14px] font-semibold hover:bg-soft transition-colors"
            >
              Continue editing
            </button>
            <button
              onClick={handlePublish}
              disabled={!isComplete || isPublishing || isPublished}
              className={`flex-1 py-3 px-6 rounded-full text-[14px] font-semibold transition-colors ${
                isComplete
                  ? 'bg-go text-[#00301E] hover:bg-[#04B76B]'
                  : 'bg-rule text-ink-3 cursor-not-allowed'
              }`}
            >
              {isPublishing ? 'Publishing...' : isPublished ? 'Published' : 'Publish Venture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
