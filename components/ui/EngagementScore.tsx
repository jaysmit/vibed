'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EngagementItem } from '@/lib/domain/engagement';

interface EngagementScoreProps {
  ventureSlug: string;
  items: EngagementItem[];
  totalScore: number;
  maxScore: number;
}

export function EngagementScore({ ventureSlug, items, totalScore, maxScore }: EngagementScoreProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const percentage = Math.round((totalScore / maxScore) * 100);

  // Get items that aren't complete
  const incompleteItems = items.filter(item => item.earned < item.maxPoints);
  const completeItems = items.filter(item => item.earned >= item.maxPoints);

  const handleAction = (item: EngagementItem) => {
    if (!item.actionPath) return;
    setNavigatingTo(item.key);
    router.push(item.actionPath);
  };

  // Score level labels
  const getScoreLevel = (pct: number) => {
    if (pct >= 90) return { label: 'Excellent', color: 'text-go-deep', bg: 'bg-go' };
    if (pct >= 70) return { label: 'Great', color: 'text-go-deep', bg: 'bg-go' };
    if (pct >= 50) return { label: 'Good', color: 'text-warn', bg: 'bg-warn' };
    if (pct >= 30) return { label: 'Building', color: 'text-ink-2', bg: 'bg-ink-3' };
    return { label: 'Getting started', color: 'text-ink-3', bg: 'bg-rule' };
  };

  const level = getScoreLevel(percentage);

  return (
    <div className="bg-page border border-rule rounded-xl overflow-hidden">
      {/* Header - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-soft/50 transition-colors"
      >
        {/* Score ring */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-rule"
            />
            <circle
              cx="18" cy="18" r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${percentage} 100`}
              className={level.color}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[14px] font-bold font-mono">{percentage}</span>
          </div>
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold">Engagement Score</h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${level.bg} text-white`}>
              {level.label}
            </span>
          </div>
          <p className="text-[12px] text-ink-3 mt-0.5">
            {incompleteItems.length > 0
              ? `${incompleteItems.length} ways to boost your score`
              : 'Your story is fully engaging!'}
          </p>
        </div>

        <svg
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-ink-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-rule">
          {/* Incomplete items - actions available */}
          {incompleteItems.length > 0 && (
            <div className="p-4 space-y-3">
              <h4 className="text-[12px] font-semibold text-ink-3 uppercase tracking-wide">Boost your score</h4>
              {incompleteItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-lg bg-soft/50 hover:bg-soft transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-go-tint flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] font-bold text-go-deep">+{item.maxPoints - item.earned}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[13px] font-semibold">{item.label}</h5>
                    <p className="text-[11px] text-ink-3 mt-0.5">{item.description}</p>
                    {item.earned > 0 && (
                      <div className="mt-2 h-1.5 bg-rule rounded-full overflow-hidden">
                        <div
                          className="h-full bg-go rounded-full"
                          style={{ width: `${(item.earned / item.maxPoints) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {item.action && item.actionPath && (
                    <button
                      onClick={() => handleAction(item)}
                      disabled={navigatingTo === item.key}
                      className="text-[12px] font-semibold text-go-deep hover:underline disabled:opacity-70 flex items-center gap-1"
                    >
                      {navigatingTo === item.key ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        item.action
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Complete items */}
          {completeItems.length > 0 && (
            <div className="p-4 border-t border-rule">
              <h4 className="text-[12px] font-semibold text-ink-3 uppercase tracking-wide mb-3">Completed</h4>
              <div className="space-y-2">
                {completeItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-[13px] text-ink-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-go">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item.label}
                    <span className="text-[11px] text-ink-3 ml-auto">+{item.maxPoints}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Planning section */}
          <div className="p-4 border-t border-rule bg-soft/30">
            <h4 className="text-[12px] font-semibold text-ink-3 uppercase tracking-wide mb-3">Plan ahead</h4>
            <p className="text-[12px] text-ink-2 mb-3">
              Keep your audience engaged by planning future content. What will you share next?
            </p>
            <button
              onClick={() => {
                setNavigatingTo('plan');
                router.push(`/v/${ventureSlug}/edit?tab=journey`);
              }}
              disabled={navigatingTo === 'plan'}
              className="text-[12px] font-semibold text-go-deep hover:underline flex items-center gap-1 disabled:opacity-70"
            >
              {navigatingTo === 'plan' ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Plan your journey
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
