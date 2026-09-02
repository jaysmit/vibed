'use client';

import { useState, useRef, useEffect } from 'react';
import { ALL_COUNTRIES, POPULAR_COUNTRIES, getCountryName, type Country } from '@/lib/domain/countries';

interface CountrySelectorProps {
  value: string | null;
  onChange: (code: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = 'Select a country',
  className = '',
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = search.trim()
    ? ALL_COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleSelect = (country: Country) => {
    onChange(country.code);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Display selected or search input */}
      <div
        className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] cursor-pointer flex items-center justify-between focus-within:ring-2 focus-within:ring-go focus-within:border-transparent transition-shadow"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="flex-1 bg-transparent outline-none placeholder:text-ink-3"
            onClick={(e) => e.stopPropagation()}
          />
        ) : value ? (
          <span>{getCountryName(value)}</span>
        ) : (
          <span className="text-ink-3">{placeholder}</span>
        )}
        <div className="flex items-center gap-2">
          {value && !isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-ink-3 hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-page border border-rule rounded-xl shadow-lg max-h-[300px] overflow-y-auto">
          {/* Show search results or popular + all */}
          {search.trim() ? (
            filteredCountries.length > 0 ? (
              <div className="p-2">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[14px] hover:bg-soft transition-colors ${
                      value === country.code ? 'bg-go-tint text-go-deep font-medium' : ''
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-ink-3 text-[14px]">
                No countries found
              </div>
            )
          ) : (
            <>
              {/* Popular countries */}
              <div className="p-2 border-b border-rule">
                <div className="px-3 py-1 text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                  Popular
                </div>
                {POPULAR_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[14px] hover:bg-soft transition-colors ${
                      value === country.code ? 'bg-go-tint text-go-deep font-medium' : ''
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>

              {/* All countries */}
              <div className="p-2">
                <div className="px-3 py-1 text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                  All Countries
                </div>
                {ALL_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[14px] hover:bg-soft transition-colors ${
                      value === country.code ? 'bg-go-tint text-go-deep font-medium' : ''
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
