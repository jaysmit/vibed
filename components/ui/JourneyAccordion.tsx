'use client';

import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';

interface SegmentClip {
  playback_id?: string;
  title: string;
  thumbTime?: number;
  durationSec: number;
}

interface JourneySegment {
  key: string;
  number: number;
  title: string;
  subtitle: string;
  content?: string;
  happenedAt?: string;  // When this actually happened (for timeline ordering)
  publishedAt?: string;
  updatedAt?: string;
  clip?: SegmentClip;
}

interface StageGroup {
  rung: string;
  label: string;
  isCurrent: boolean;
  isPast: boolean;
  segments: JourneySegment[];
}

interface JourneyAccordionProps {
  stages: StageGroup[];
  ventureName: string;
  isOwner?: boolean;
  ventureSlug?: string;
}

export function JourneyAccordion({ stages, ventureName, isOwner, ventureSlug }: JourneyAccordionProps) {
  // Track which segment is currently open (only one at a time)
  const [openSegmentKey, setOpenSegmentKey] = useState<string | null>(() => {
    // Find the first segment with content to open by default
    for (const stage of stages) {
      for (const seg of stage.segments) {
        if (seg.content) {
          return seg.key;
        }
      }
    }
    return null;
  });

  const toggleSegment = (key: string) => {
    setOpenSegmentKey(current => current === key ? null : key);
  };

  // Format date for display
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Format happenedAt date more prominently
  function formatTimelineDate(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString('en-AU', {
      month: 'short',
      year: 'numeric',
    });
  }

  // Format duration for display
  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  return (
    <div className="space-y-6">
      {stages.map((stage) => {
        const hasAnyContent = stage.segments.some(s => s.content || s.clip);
        const isFuture = !stage.isPast && !stage.isCurrent;

        return (
          <div
            key={stage.rung}
            className={`${isFuture && !hasAnyContent ? 'opacity-40' : ''}`}
          >
            {/* Stage header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  stage.isPast ? 'bg-go' : stage.isCurrent ? 'bg-go ring-4 ring-go/20' : 'bg-rule'
                }`}
              />
              <h3 className={`text-[15px] font-bold ${stage.isCurrent ? 'text-go-deep' : ''}`}>
                {stage.label}
              </h3>
              {stage.isCurrent && (
                <span className="text-[11px] bg-go-tint text-go-deep px-2 py-0.5 rounded-full font-semibold">
                  Current
                </span>
              )}
            </div>

            {/* Segments in this stage */}
            <div className="ml-6 border-l border-rule pl-4 space-y-2">
              {stage.segments.map((seg) => {
                const isOpen = openSegmentKey === seg.key;
                const hasContent = !!seg.content;
                const hasClip = !!seg.clip?.playback_id;
                const hasAnything = hasContent || hasClip;

                // Empty state - no content or clip
                if (!hasAnything) {
                  return (
                    <div
                      key={seg.key}
                      className="py-3 px-4 rounded-lg bg-soft/50 border border-dashed border-rule"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-ink-3 font-medium w-6">
                          {String(seg.number).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-semibold text-ink-3">{seg.title}</h4>
                          <p className="text-[11px] text-ink-3 truncate">{seg.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Placeholder clip icon */}
                          <div className="w-8 h-8 rounded bg-rule/50 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                          <span className="text-[11px] text-ink-3 italic hidden sm:block">Not written yet</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Has content - accordion item
                return (
                  <div
                    key={seg.key}
                    className={`rounded-lg border transition-all ${
                      isOpen ? 'border-go bg-page shadow-sm' : 'border-rule bg-soft/50 hover:border-ink/20'
                    }`}
                  >
                    <button
                      onClick={() => toggleSegment(seg.key)}
                      className="w-full text-left py-3 px-4 flex items-center gap-3"
                    >
                      {/* Timeline date badge */}
                      {seg.happenedAt ? (
                        <span className="font-mono text-[10px] text-ink-2 bg-soft px-2 py-1 rounded font-medium w-14 text-center flex-shrink-0">
                          {formatTimelineDate(seg.happenedAt)}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-ink-3 font-medium w-14 text-center flex-shrink-0">
                          {String(seg.number).padStart(2, '0')}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold">{seg.title}</h4>
                        {!isOpen && hasContent && (
                          <p className="text-[12px] text-ink-2 truncate mt-0.5">{seg.content?.slice(0, 80)}...</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Clip indicator */}
                        {hasClip && (
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${isOpen ? 'bg-go-tint' : 'bg-ink/10'}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isOpen ? 'text-go-deep' : 'text-ink-2'}>
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        )}
                        {!hasClip && (
                          <div className="w-8 h-8 rounded bg-rule/30 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        )}
                        <span
                          className={`text-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1">
                        <p className="text-[11px] text-ink-3 mb-3">{seg.subtitle}</p>

                        {/* Clip and text side by side on desktop, stacked on mobile */}
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Clip - left side on desktop, square like Instagram */}
                          <div className="w-[120px] sm:w-[140px] lg:w-[160px] flex-shrink-0">
                            {hasClip && seg.clip ? (
                              <div className="aspect-square rounded-lg overflow-hidden bg-ink/10 relative group">
                                <VideoPlayer
                                  playbackId={seg.clip.playback_id!}
                                  title={`${ventureName} - ${seg.title}`}
                                  thumbTime={seg.clip.thumbTime}
                                />
                                {/* Play icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                                      <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                  </div>
                                </div>
                                {/* Duration badge */}
                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                                  {formatDuration(seg.clip.durationSec)}
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square rounded-lg border-2 border-dashed border-rule bg-soft flex flex-col items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3 mb-1">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span className="text-[10px] text-ink-3">No clip</span>
                                {isOwner && ventureSlug && (
                                  <a
                                    href={`/v/${ventureSlug}/edit`}
                                    className="mt-1 text-[9px] font-semibold text-go-deep hover:underline"
                                  >
                                    Add
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Text content - right side */}
                          <div className="flex-1 min-w-0">
                            {hasContent ? (
                              <div className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-wrap">
                                {seg.content}
                              </div>
                            ) : (
                              <div className="py-8 text-center">
                                <p className="text-[14px] text-ink-3">No written content yet</p>
                                {isOwner && ventureSlug && (
                                  <a
                                    href={`/v/${ventureSlug}/edit`}
                                    className="mt-2 inline-block text-[12px] font-semibold text-go-deep hover:underline"
                                  >
                                    Write this segment
                                  </a>
                                )}
                              </div>
                            )}
                            {(seg.happenedAt || seg.publishedAt || seg.updatedAt) && hasContent && (
                              <div className="flex gap-4 mt-4 pt-3 border-t border-rule text-[11px] text-ink-3">
                                {seg.happenedAt && (
                                  <span className="font-medium text-ink-2">
                                    Happened {formatDate(seg.happenedAt)}
                                  </span>
                                )}
                                {seg.publishedAt && <span>Published {formatDate(seg.publishedAt)}</span>}
                                {seg.updatedAt && seg.updatedAt !== seg.publishedAt && (
                                  <span>Updated {formatDate(seg.updatedAt)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
