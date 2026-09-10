'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from './VideoPlayerLazy';

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
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Track which segment is currently open (only one at a time)
  // Default to "spark" segment if it has content
  const [openSegmentKey, setOpenSegmentKey] = useState<string | null>(() => {
    // Check if spark has content - if so, default to it
    for (const stage of stages) {
      for (const seg of stage.segments) {
        if (seg.key === 'spark' && seg.content) {
          return 'spark';
        }
      }
    }

    // If spark has no content, return null (all collapsed)
    return null;
  });

  const toggleSegment = (key: string) => {
    setOpenSegmentKey(current => current === key ? null : key);
  };

  const handleEditSegment = (segmentKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ventureSlug) return;
    setNavigatingTo(segmentKey);
    router.push(`/v/${ventureSlug}/edit?segment=${segmentKey}`);
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
                  const isNavigating = navigatingTo === seg.key;
                  return (
                    <div
                      key={seg.key}
                      className={`py-3 px-4 rounded-lg border border-dashed transition-all ${
                        isOwner
                          ? 'bg-soft/50 border-go/40 hover:border-go hover:bg-go-tint/30 cursor-pointer group'
                          : 'bg-soft/50 border-rule'
                      } ${isNavigating ? 'opacity-70' : ''}`}
                      onClick={isOwner ? (e) => handleEditSegment(seg.key, e) : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-ink-3 font-medium w-6">
                          {String(seg.number).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[14px] font-semibold ${isOwner ? 'text-ink-2 group-hover:text-ink' : 'text-ink-3'}`}>
                            {seg.title}
                          </h4>
                          <p className="text-[11px] text-ink-3 truncate">{seg.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwner ? (
                            isNavigating ? (
                              <div className="flex items-center gap-2 text-go-deep">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              </div>
                            ) : (
                              <span className="text-[11px] font-medium text-go-deep opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                                Write this
                              </span>
                            )
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded bg-rule/50 flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              </div>
                              <span className="text-[11px] text-ink-3 italic hidden sm:block">Not written yet</span>
                            </>
                          )}
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

                        {/* Content with floated clip */}
                        <div className="overflow-hidden">
                          {/* Clip - floated left, 1.5x larger size */}
                          {hasClip && seg.clip ? (
                            <div className="float-left mr-5 mb-4 w-[300px] sm:w-[360px]">
                              <div className="aspect-square rounded-lg overflow-hidden bg-ink/10 relative group">
                                <VideoPlayer
                                  playbackId={seg.clip.playback_id!}
                                  title={`${ventureName} - ${seg.title}`}
                                  thumbTime={seg.clip.thumbTime}
                                />
                                {/* Play icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                                      <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                  </div>
                                </div>
                                {/* Duration badge */}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                                  {formatDuration(seg.clip.durationSec)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="float-left mr-5 mb-4 w-[240px] sm:w-[280px]">
                              <div className="aspect-square rounded-lg border-2 border-dashed border-rule bg-soft flex flex-col items-center justify-center">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3 mb-2">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span className="text-[12px] text-ink-3">No clip</span>
                                {isOwner && ventureSlug && (
                                  <a
                                    href={`/v/${ventureSlug}/edit`}
                                    className="mt-2 text-[11px] font-semibold text-go-deep hover:underline"
                                  >
                                    Add clip
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Text content - wraps around the clip */}
                          {hasContent ? (
                            <div className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-wrap">
                              {seg.content}
                            </div>
                          ) : (
                            <div className="py-8">
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
                        </div>

                        {/* Metadata footer - clear the float */}
                        <div className="clear-both flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-rule text-[11px] text-ink-3">
                          {seg.happenedAt && (
                            <span className="font-medium text-ink-2">
                              Happened {formatDate(seg.happenedAt)}
                            </span>
                          )}
                          {seg.publishedAt && <span>Published {formatDate(seg.publishedAt)}</span>}
                          {seg.updatedAt && seg.updatedAt !== seg.publishedAt && (
                            <span>Updated {formatDate(seg.updatedAt)}</span>
                          )}

                          {/* Owner edit button */}
                          {isOwner && ventureSlug && (
                            <button
                              onClick={(e) => handleEditSegment(seg.key, e)}
                              disabled={navigatingTo === seg.key}
                              className="ml-auto flex items-center gap-1.5 text-[12px] font-medium text-go-deep hover:underline disabled:opacity-70"
                            >
                              {navigatingTo === seg.key ? (
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
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  Edit
                                </>
                              )}
                            </button>
                          )}
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
