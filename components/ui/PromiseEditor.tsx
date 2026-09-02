'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface PromiseEditorProps {
  ventureId: string;
  hasActivePromise?: boolean;
  className?: string;
}

export function PromiseEditor({ ventureId, hasActivePromise = false, className = '' }: PromiseEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('Promise text is required');
      return;
    }

    if (!dueAt) {
      setError('Due date is required');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/promise`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), dueAt }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to create promise');
          return;
        }

        // Reset form and close
        setText('');
        setDueAt('');
        setIsOpen(false);
        router.refresh();
      } catch {
        setError('Something went wrong');
      }
    });
  };

  const handleComplete = async (kept: boolean) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/promise`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kept }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to complete promise');
          return;
        }

        router.refresh();
      } catch {
        setError('Something went wrong');
      }
    });
  };

  if (!isOpen && !hasActivePromise) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-warn text-white rounded-lg hover:bg-warn/90 transition-colors ${className}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        Make a promise
      </button>
    );
  }

  if (hasActivePromise) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={() => handleComplete(true)}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-go text-white rounded-lg hover:bg-go-deep transition-colors disabled:opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Kept it
        </button>
        <button
          onClick={() => handleComplete(false)}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-dead text-dead rounded-lg hover:bg-dead-tint transition-colors disabled:opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Missed it
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-warn-tint border border-warn/30 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold">New Promise</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-ink-3 hover:text-ink transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-ink-2 mb-1">
            What do you promise to do?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ship the landing page, get 10 customers, launch on Product Hunt..."
            className="w-full px-3 py-2 text-[14px] border border-rule rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-warn/30 focus:border-warn"
            rows={2}
            maxLength={500}
          />
          <div className="text-[11px] text-ink-3 mt-1 text-right">{text.length}/500</div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-ink-2 mb-1">
            By when?
          </label>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            min={minDate}
            className="w-full px-3 py-2 text-[14px] border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-warn/30 focus:border-warn"
          />
        </div>

        {error && (
          <div className="text-[12px] text-dead font-medium">{error}</div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending || !text.trim() || !dueAt}
            className="flex-1 py-2 text-[13px] font-semibold bg-warn text-white rounded-lg hover:bg-warn/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : 'Make this promise'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-[13px] font-semibold border border-rule rounded-lg hover:bg-soft transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
