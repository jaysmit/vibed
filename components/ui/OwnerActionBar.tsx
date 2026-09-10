'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SegmentKey } from '@/lib/domain/rungs';
import type { EngagementItem } from '@/lib/domain/engagement';

interface Segment {
  key: SegmentKey;
  title: string;
  hasContent: boolean;
  hasClip: boolean;
}

interface OwnerActionBarProps {
  ventureSlug: string;
  ventureName: string;
  segments: Segment[];
  clipsCount: number;
  hasPromise: boolean;
  engagementScore: number;
  engagementMax: number;
  engagementItems: EngagementItem[];
}

export function OwnerActionBar({
  ventureSlug,
  ventureName,
  segments,
  clipsCount,
  hasPromise,
  engagementScore,
  engagementMax,
  engagementItems,
}: OwnerActionBarProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [showEngagement, setShowEngagement] = useState(false);

  const handleNavigate = (path: string, key: string) => {
    setIsNavigating(key);
    router.push(path);
  };

  // Engagement percentage
  const engagementPercent = Math.round((engagementScore / engagementMax) * 100);
  const incompleteItems = engagementItems.filter(item => item.earned < item.maxPoints);

  // Find segments that need content or clips
  const emptySegments = segments.filter(s => !s.hasContent);
  const segmentsWithoutClips = segments.filter(s => s.hasContent && !s.hasClip);

  // Suggestions for what to do next
  const suggestions: { key: string; icon: React.ReactNode; text: string; action: () => void; priority: 'high' | 'medium' | 'low' }[] = [];

  // High priority: No clips yet
  if (clipsCount === 0) {
    suggestions.push({
      key: 'first-clip',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      text: 'Record your first video clip',
      action: () => handleNavigate(`/v/${ventureSlug}/edit?tab=clips`, 'first-clip'),
      priority: 'high',
    });
  }

  // High priority: No promise set
  if (!hasPromise) {
    suggestions.push({
      key: 'promise',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      text: 'Set a goal to keep momentum',
      action: () => handleNavigate(`/v/${ventureSlug}/edit?tab=promise`, 'promise'),
      priority: 'high',
    });
  }

  // Medium priority: Empty segments
  if (emptySegments.length > 0) {
    const nextSegment = emptySegments[0];
    suggestions.push({
      key: 'next-segment',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      text: `Write about "${nextSegment.title}"`,
      action: () => handleNavigate(`/v/${ventureSlug}/edit?segment=${nextSegment.key}`, 'next-segment'),
      priority: 'medium',
    });
  }

  // Low priority: Segments without clips
  if (segmentsWithoutClips.length > 0 && clipsCount > 0) {
    const nextClipSegment = segmentsWithoutClips[0];
    suggestions.push({
      key: 'next-clip',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      text: `Add a clip for "${nextClipSegment.title}"`,
      action: () => handleNavigate(`/v/${ventureSlug}/edit?segment=${nextClipSegment.key}`, 'next-clip'),
      priority: 'low',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Take top 2 suggestions
  const topSuggestions = suggestions.slice(0, 2);

  return (
    <div className="bg-go-tint border-b border-go/20">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Left side: Potential Engagement Score */}
          <div className="relative">
            <button
              onClick={() => setShowEngagement(!showEngagement)}
              className="flex items-center gap-3 bg-white/80 hover:bg-white px-3 py-2 rounded-lg transition-colors"
            >
              {/* Mini score ring */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#E4E4E1" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="#05CE78"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${engagementPercent} 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold font-mono">{engagementPercent}</span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-[12px] font-semibold text-go-deep">Potential Score</div>
                <div className="text-[11px] text-ink-3">
                  {incompleteItems.length > 0 ? `${incompleteItems.length} ways to boost` : 'Maxed out!'}
                </div>
              </div>
              <svg
                width="14" height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-ink-3 transition-transform ${showEngagement ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* Dropdown */}
            {showEngagement && (
              <div className="absolute top-full left-0 mt-2 w-[320px] bg-white border border-rule rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-4 border-b border-rule bg-soft/50">
                  <h4 className="text-[13px] font-bold">Boost Your Engagement</h4>
                  <p className="text-[11px] text-ink-3 mt-1">Complete these to help visitors discover and engage with your venture</p>
                </div>
                <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {engagementItems.map((item) => {
                    const isComplete = item.earned >= item.maxPoints;
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-3 p-2.5 rounded-lg ${isComplete ? 'bg-go-tint/50' : 'bg-soft/50 hover:bg-soft'}`}
                      >
                        {isComplete ? (
                          <div className="w-6 h-6 rounded-full bg-go flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-go-tint flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-go-deep">+{item.maxPoints - item.earned}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium">{item.label}</div>
                          <div className="text-[10px] text-ink-3 truncate">{item.description}</div>
                        </div>
                        {!isComplete && item.action && item.actionPath && (
                          <button
                            onClick={() => handleNavigate(item.actionPath!, item.key)}
                            disabled={isNavigating === item.key}
                            className="text-[11px] font-semibold text-go-deep hover:underline flex-shrink-0"
                          >
                            {isNavigating === item.key ? '...' : item.action}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Middle: Suggestions */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {topSuggestions.length > 0 ? (
              <>
                <span className="text-[12px] text-go-deep font-medium hidden sm:inline">Next up:</span>
                {topSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.key}
                    onClick={suggestion.action}
                    disabled={isNavigating === suggestion.key}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-go-deep bg-white/60 hover:bg-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-70"
                  >
                    {isNavigating === suggestion.key ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      suggestion.icon
                    )}
                    <span className="hidden sm:inline">{suggestion.text}</span>
                    <span className="sm:hidden">
                      {suggestion.key === 'first-clip' ? 'Add clip' :
                       suggestion.key === 'promise' ? 'Set goal' :
                       suggestion.key === 'next-segment' ? 'Write story' :
                       'Add clip'}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <span className="text-[12px] text-go-deep hidden sm:inline">
                Looking great! Keep sharing updates.
              </span>
            )}
          </div>

          {/* Right side: Edit button */}
          <button
            onClick={() => handleNavigate(`/v/${ventureSlug}/edit`, 'edit')}
            disabled={isNavigating === 'edit'}
            className="inline-flex items-center gap-2 text-[13px] font-semibold bg-go text-white px-4 py-2 rounded-lg hover:bg-go-deep transition-colors disabled:opacity-70 flex-shrink-0"
          >
            {isNavigating === 'edit' ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit / Add to Venture
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
