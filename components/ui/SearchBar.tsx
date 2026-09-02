'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from './Avatar';

interface SearchResult {
  type: 'founder' | 'venture';
  id: string;
  name: string;
  slug: string;
  subtitle?: string;
  imageUrl?: string;
  glyph?: string;
  brand?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      }
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <span className="absolute left-[13px] top-1/2 -translate-y-1/2 opacity-45">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
        placeholder="Search ventures, founders..."
        className="w-full bg-bg border border-rule rounded-full py-[9px] pl-9 pr-[14px] text-[14px] focus:outline-none focus:border-ink focus:bg-page"
      />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-page border border-rule rounded-xl shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="px-4 py-3 text-[13px] text-ink-3">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-[13px] text-ink-3">No results found</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.type === 'founder' ? `/founder/${result.slug}` : `/v/${result.slug}`}
                  onClick={handleSelect}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-soft transition-colors"
                >
                  {result.type === 'founder' ? (
                    <Avatar
                      name={result.name}
                      imageUrl={result.imageUrl}
                      size="md"
                      color="#5A2EC4"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: result.brand || '#F4F4F1' }}
                    >
                      {result.glyph || '🚀'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">{result.name}</div>
                    {result.subtitle && (
                      <div className="text-[12px] text-ink-3 truncate">{result.subtitle}</div>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    result.type === 'founder' ? 'bg-heat-tint text-heat' : 'bg-go-tint text-go-deep'
                  }`}>
                    {result.type === 'founder' ? 'Founder' : 'Venture'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
