'use client';

import { useState } from 'react';
import { INDUSTRIES, INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

interface CategorySelectorProps {
  value: Industry[];
  onChange: (categories: Industry[]) => void;
  onCustomCategory?: (customCategory: string) => void;
  customCategory?: string;
  maxSelection?: number;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  onCustomCategory,
  customCategory = '',
  maxSelection = 3,
  className = '',
}: CategorySelectorProps) {
  const [localCustomCategory, setLocalCustomCategory] = useState(customCategory);

  const toggleCategory = (category: Industry) => {
    if (value.includes(category)) {
      // Remove category
      onChange(value.filter((c) => c !== category));
      // Clear custom category if "other" is deselected
      if (category === 'other' && onCustomCategory) {
        onCustomCategory('');
        setLocalCustomCategory('');
      }
    } else if (value.length < maxSelection) {
      // Add category
      onChange([...value, category]);
    }
  };

  const handleCustomCategoryChange = (newValue: string) => {
    setLocalCustomCategory(newValue);
    if (onCustomCategory) {
      onCustomCategory(newValue);
    }
  };

  const isMaxReached = value.length >= maxSelection;
  const isOtherSelected = value.includes('other');

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

      {/* Custom category input when "Other" is selected */}
      {isOtherSelected && (
        <div className="mt-4">
          <label className="block text-[13px] font-medium mb-2">
            Describe your category
          </label>
          <input
            type="text"
            value={localCustomCategory}
            onChange={(e) => handleCustomCategoryChange(e.target.value)}
            placeholder="e.g., Real Estate, Legal Tech, Agriculture"
            className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
          />
        </div>
      )}

      <p className="text-[12px] text-ink-3 mt-3">
        {value.length} of {maxSelection} selected
        {isMaxReached && ' (maximum reached)'}
      </p>
    </div>
  );
}
