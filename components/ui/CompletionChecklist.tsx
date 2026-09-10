'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  REQUIREMENT_LABELS,
  REQUIREMENT_ACTIONS,
  STAGE_LABELS,
  type PublishingRequirements,
  type StageRequirements
} from '@/lib/domain/standards';

interface CompletionChecklistProps {
  ventureId: string;
  ventureSlug: string;
  percentage: number;
  requirements: PublishingRequirements;
  stageRequirements?: StageRequirements;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  onClose: () => void;
}

export function CompletionChecklist({
  ventureId,
  ventureSlug,
  percentage,
  requirements,
  stageRequirements,
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

  // Build link for each requirement
  const getRequirementLink = (key: keyof PublishingRequirements): string => {
    const field = REQUIREMENT_ACTIONS[key].field;
    if (field === 'poster' || field === 'name' || field === 'pitch') {
      // For basics fields, check if it's the segment or the basics field
      if (key === 'hasElevatorPitch') {
        return `/v/${ventureSlug}/edit?segment=pitch`;
      }
      return `/v/${ventureSlug}/edit?field=${field}`;
    }
    if (field === 'spark') {
      return `/v/${ventureSlug}/edit?segment=spark`;
    }
    if (field === 'pitch-video') {
      return `/v/${ventureSlug}/edit?segment=pitch`;
    }
    return `/v/${ventureSlug}/edit`;
  };

  // Split requirements into basics and journey
  const basicsRequirements: [keyof PublishingRequirements, boolean][] = [
    ['hasName', requirements.hasName],
    ['hasPitch', requirements.hasPitch],
    ['hasCoverImage', requirements.hasCoverImage],
  ];

  const journeyRequirements: [keyof PublishingRequirements, boolean][] = [
    ['hasElevatorPitch', requirements.hasElevatorPitch],
    ['hasSparkStory', requirements.hasSparkStory],
  ];

  const renderRequirementItem = ([key, met]: [keyof PublishingRequirements, boolean]) => (
    <div
      key={key}
      className={`flex items-center gap-3 p-3 rounded-xl ${
        met ? 'bg-go-tint' : 'bg-soft'
      }`}
    >
      {met ? (
        <div className="w-6 h-6 rounded-full bg-go flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-ink-3 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] font-medium ${met ? 'text-go-deep' : 'text-ink'}`}>
          {REQUIREMENT_LABELS[key]}
        </div>
        {!met && (
          <div className="text-[12px] text-ink-3 truncate">
            {REQUIREMENT_ACTIONS[key].action}
          </div>
        )}
      </div>
      {!met && (
        <Link
          href={getRequirementLink(key)}
          className="text-[12px] font-semibold text-go-deep hover:underline flex-shrink-0"
          onClick={onClose}
        >
          Add →
        </Link>
      )}
    </div>
  );

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
              : `${percentage}% complete — finish these items to go live.`}
          </p>
        </div>

        {/* Requirements */}
        <div className="p-6 space-y-3">
          {/* Basics Section */}
          <h3 className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-3">
            Basics
          </h3>
          {basicsRequirements.map(renderRequirementItem)}

          {/* Journey Section */}
          <div className="pt-4 mt-4 border-t border-rule">
            <h3 className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-3">
              Your Journey
            </h3>
            {journeyRequirements.map(renderRequirementItem)}
          </div>

          {/* Optional: Pitch Video */}
          <div className="pt-4 mt-4 border-t border-rule">
            <h3 className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-3">
              Recommended
            </h3>

            <div
              className={`flex items-center gap-3 p-3 rounded-xl ${
                requirements.hasPitchVideo ? 'bg-heat-tint' : 'bg-soft'
              }`}
            >
              {requirements.hasPitchVideo ? (
                <div className="w-6 h-6 rounded-full bg-heat flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-ink-3 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] font-medium ${requirements.hasPitchVideo ? 'text-heat' : 'text-ink'}`}>
                    Pitch video
                  </span>
                  <span className="text-[10px] bg-heat-tint text-heat px-1.5 py-0.5 rounded font-medium">
                    Optional
                  </span>
                </div>
                {!requirements.hasPitchVideo && (
                  <div className="text-[12px] text-ink-3">
                    30-60 seconds brings your story to life
                  </div>
                )}
              </div>
              {!requirements.hasPitchVideo && (
                <Link
                  href={`/v/${ventureSlug}/edit?segment=pitch`}
                  className="text-[12px] font-semibold text-heat hover:underline flex-shrink-0"
                  onClick={onClose}
                >
                  Record →
                </Link>
              )}
            </div>
          </div>

          {/* Future stages - Planning section */}
          {stageRequirements && (
            <div className="pt-4 mt-4 border-t border-rule">
              <h3 className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-2">
                Plan Your Journey
              </h3>
              <p className="text-[12px] text-ink-2 mb-3">
                Haven&apos;t reached these stages yet? Write your plans — the community can help.
              </p>

              <div className="space-y-2">
                {(Object.entries(stageRequirements) as [keyof StageRequirements, boolean][]).map(([key, completed]) => {
                  const segmentMap: Record<string, string> = {
                    hasValidation: 'validation',
                    hasPrototype: 'proto',
                    hasBuild: 'build',
                    hasLaunch: 'launch',
                    hasFirstDollar: 'first',
                  };
                  const segment = segmentMap[key] || key;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-soft transition-colors"
                    >
                      {completed ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-go">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                      <span className={`flex-1 text-[13px] ${completed ? 'text-go-deep' : 'text-ink-2'}`}>
                        {STAGE_LABELS[key]}
                      </span>
                      <Link
                        href={`/v/${ventureSlug}/edit?segment=${segment}`}
                        className="text-[11px] text-ink-3 hover:text-ink"
                        onClick={onClose}
                      >
                        {completed ? 'Edit' : 'Plan'} →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
