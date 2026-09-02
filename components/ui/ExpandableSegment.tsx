'use client';

import { useState } from 'react';

interface ExpandableSegmentProps {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  content?: string;
  publishedAt?: string;
  updatedAt?: string;
  defaultOpen?: boolean;
}

export function ExpandableSegment({
  id,
  number,
  title,
  subtitle,
  content,
  publishedAt,
  updatedAt,
  defaultOpen = false,
}: ExpandableSegmentProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasContent = !!content;

  // Format date for display
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (!hasContent) {
    // Empty state - locked segment
    return (
      <div
        id={id}
        className="py-3 px-4 rounded-lg bg-soft/50 opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-ink-3 font-medium w-6">
            {String(number).padStart(2, '0')}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] font-semibold text-ink-3">{title}</h4>
            <p className="text-[11px] text-ink-3 truncate">{subtitle}</p>
          </div>
          <span className="text-[11px] text-ink-3 italic">Not written yet</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`rounded-lg border transition-all ${
        isOpen ? 'border-go bg-page shadow-sm' : 'border-rule bg-soft/50 hover:border-ink/20'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-3 px-4 flex items-center gap-3"
      >
        <span className="font-mono text-[11px] text-ink-3 font-medium w-6">
          {String(number).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold">{title}</h4>
          {!isOpen && (
            <p className="text-[12px] text-ink-2 truncate mt-0.5">{content?.slice(0, 80)}...</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="text-[10px] text-ink-3 hidden sm:block">
              {formatDate(updatedAt)}
            </span>
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
          <p className="text-[11px] text-ink-3 mb-3">{subtitle}</p>
          <div className="text-[15px] leading-relaxed text-ink-2 whitespace-pre-wrap">
            {content}
          </div>
          {(publishedAt || updatedAt) && (
            <div className="flex gap-4 mt-4 pt-3 border-t border-rule text-[11px] text-ink-3">
              {publishedAt && <span>Published {formatDate(publishedAt)}</span>}
              {updatedAt && updatedAt !== publishedAt && (
                <span>Updated {formatDate(updatedAt)}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
