'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { REQUIREMENT_LABELS, type PublishingRequirements } from '@/lib/domain/standards';

interface PublishButtonProps {
  ventureId: string;
  percentage: number;
  requirements: PublishingRequirements;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  className?: string;
}

export function PublishButton({
  ventureId,
  percentage,
  requirements,
  status,
  className = '',
}: PublishButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const isComplete = percentage >= 100;
  const isPublished = status === 'live';

  const handlePublish = async () => {
    if (!isComplete) {
      setShowRequirements(!showRequirements);
      return;
    }

    setIsLoading(true);
    try {
      await fetch(`/api/ventures/${ventureId}/publish`, {
        method: 'POST',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to publish:', error);
    }
    setIsLoading(false);
  };

  // If already published, don't show button
  if (isPublished) {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 bg-go-tint text-go-deep rounded-full text-[13px] font-semibold ${className}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Published
      </div>
    );
  }

  // If closed, don't show button
  if (status === 'closed') {
    return null;
  }

  const missingRequirements = Object.entries(requirements)
    .filter(([, met]) => !met)
    .map(([key]) => REQUIREMENT_LABELS[key as keyof PublishingRequirements]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handlePublish}
        disabled={isLoading}
        className={`px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors disabled:opacity-50 ${
          isComplete
            ? 'bg-go text-[#00301E] hover:bg-[#04B76B]'
            : 'bg-rule text-ink-2 cursor-default'
        }`}
      >
        {isLoading ? (
          'Publishing...'
        ) : isComplete ? (
          'Publish Venture'
        ) : (
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Complete profile to publish
          </span>
        )}
      </button>

      {/* Requirements tooltip */}
      {showRequirements && !isComplete && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-page border border-rule rounded-xl shadow-lg z-50 p-4">
          <h4 className="font-bold text-[14px] mb-3">Missing requirements:</h4>
          <ul className="space-y-2">
            {missingRequirements.map((req) => (
              <li key={req} className="flex items-center gap-2 text-[13px] text-ink-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dead">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {req}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowRequirements(false)}
            className="mt-3 text-[12px] text-ink-3 hover:text-ink"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
