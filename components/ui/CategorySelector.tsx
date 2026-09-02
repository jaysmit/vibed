'use client';

import { INDUSTRIES, INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

interface CategorySelectorProps {
  value: Industry[];
  onChange: (categories: Industry[]) => void;
  maxSelection?: number;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  maxSelection = 3,
  className = '',
}: CategorySelectorProps) {
  const toggleCategory = (category: Industry) => {
    if (value.includes(category)) {
      // Remove category
      onChange(value.filter((c) => c !== category));
    } else if (value.length < maxSelection) {
      // Add category
      onChange([...value, category]);
    }
  };

  const isMaxReached = value.length >= maxSelection;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {INDUSTRIES.map((industry) => {
          const isSelected = value.includes(industry);
          const isDisabled = !isSelected && isMaxReached;

          return (
            <button
              key={industry}
              type="button"
              onClick={() => toggleCategory(industry)}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                isSelected
                  ? 'bg-go text-[#00301E] ring-2 ring-go'
                  : isDisabled
                  ? 'bg-soft text-ink-3 cursor-not-allowed opacity-50'
                  : 'bg-soft text-ink hover:bg-rule hover:text-ink'
              }`}
            >
              {isSelected && (
                <span className="mr-1">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="inline -mt-0.5"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              )}
              {INDUSTRY_LABELS[industry]}
            </button>
          );
        })}
      </div>
      <p className="text-[12px] text-ink-3 mt-3">
        {value.length} of {maxSelection} selected
        {isMaxReached && ' (maximum reached)'}
      </p>
    </div>
  );
}
