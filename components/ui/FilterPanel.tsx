'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FilterSection {
  id: string;
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

interface FilterPanelProps {
  sections: FilterSection[];
  sortOptions: { key: string; label: string; icon: string }[];
  currentSort: string;
  buildUrl: (sort: string) => string;
  hasActiveFilters: boolean;
  clearUrl: string;
}

export function FilterPanel({
  sections,
  sortOptions,
  currentSort,
  buildUrl,
  hasActiveFilters,
  clearUrl,
}: FilterPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Default: only open sections that have defaultOpen or have active filters
    const initial: Record<string, boolean> = {};
    sections.forEach((s) => {
      initial[s.id] = s.defaultOpen ?? false;
    });
    return initial;
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-soft rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
      {/* Sort Row - always visible */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide w-12 flex-shrink-0">Sort</span>
        <div className="flex gap-2 flex-wrap">
          {sortOptions.map((opt) => (
            <Link
              key={opt.key}
              href={buildUrl(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                currentSort === opt.key
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-ink-2 hover:bg-white hover:text-ink border border-rule'
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Collapsible filter sections */}
      <div className="border-t border-rule pt-3 space-y-2">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full py-2 text-left group"
            >
              <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide">
                {section.label}
              </span>
              <svg
                className={`w-4 h-4 text-ink-3 transition-transform ${
                  openSections[section.id] ? 'rotate-180' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {openSections[section.id] && (
              <div className="pb-2">
                {section.children}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-rule">
          <Link
            href={clearUrl}
            className="text-[12px] font-medium text-ink-3 hover:text-ink flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  );
}
