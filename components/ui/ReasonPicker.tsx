'use client';

import { useEffect, useRef } from 'react';
import { ENDORSEMENT_REASON_LABELS, type EndorsementReason } from '@/lib/supabase/types';

interface ReasonPickerProps {
  onSelect: (reason: EndorsementReason) => void;
  onSkip: () => void;
  onClose: () => void;
}

const REASON_ICONS: Record<EndorsementReason, string> = {
  honest_failure: '💔',
  useful_tactics: '🎯',
  changed_thinking: '💡',
  less_alone: '🤝',
};

export function ReasonPicker({ onSelect, onSkip, onClose }: ReasonPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close on escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const reasons: EndorsementReason[] = [
    'honest_failure',
    'useful_tactics',
    'changed_thinking',
    'less_alone',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        ref={ref}
        className="bg-page rounded-2xl shadow-xl border border-rule p-5 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200"
      >
        <h3 className="text-[16px] font-bold text-center mb-1">
          Why was this helpful?
        </h3>
        <p className="text-[13px] text-ink-3 text-center mb-4">
          Optional — helps surface the best content
        </p>

        <div className="space-y-2">
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelect(reason)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-soft hover:bg-rule transition-colors text-left"
            >
              <span className="text-xl">{REASON_ICONS[reason]}</span>
              <span className="text-[14px] font-medium">
                {ENDORSEMENT_REASON_LABELS[reason]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onSkip}
          className="w-full mt-4 py-2.5 text-[13px] text-ink-3 hover:text-ink transition-colors"
        >
          Skip — just endorse
        </button>
      </div>
    </div>
  );
}
