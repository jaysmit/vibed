'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OwnerSettingsProps {
  ventureId: string;
  ventureSlug: string;
  ventureName: string;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  className?: string;
}

export function OwnerSettings({
  ventureId,
  ventureSlug,
  ventureName,
  status,
  className = '',
}: OwnerSettingsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'close' | 'delete' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTeam = () => {
    router.push(`/v/${ventureSlug}/edit?tab=team`);
    setIsOpen(false);
  };

  const handleEditUrl = () => {
    router.push(`/v/${ventureSlug}/edit?tab=settings`);
    setIsOpen(false);
  };

  const handleToggleVisibility = async () => {
    setIsLoading(true);
    try {
      const newStatus = status === 'live' ? 'draft' : 'live';
      await fetch(`/api/ventures/${ventureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  const handleClose = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/ventures/${ventureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to close venture:', error);
    }
    setIsLoading(false);
    setShowConfirm(null);
    setIsOpen(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/ventures/${ventureId}`, {
        method: 'DELETE',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete venture:', error);
    }
    setIsLoading(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-rule hover:bg-soft transition-colors"
        aria-label="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      {isOpen && !showConfirm && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-page border border-rule rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-1">
            <button
              type="button"
              onClick={handleTeam}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[14px] hover:bg-soft transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              Team
            </button>

            <button
              type="button"
              onClick={handleEditUrl}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[14px] hover:bg-soft transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              Edit URL
            </button>

            {status !== 'closed' && (
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[14px] hover:bg-soft transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {status === 'live' ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
                {status === 'live' ? 'Make Private' : 'Make Public'}
              </button>
            )}

            <div className="border-t border-rule my-1" />

            <button
              type="button"
              onClick={() => setShowConfirm('close')}
              disabled={status === 'closed'}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[14px] text-warn hover:bg-warn-tint transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18.36 6.64a9 9 0 11-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
              Close Venture
            </button>

            <button
              type="button"
              onClick={() => setShowConfirm('delete')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[14px] text-dead hover:bg-dead-tint transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialogs */}
      {showConfirm && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-page border border-rule rounded-xl shadow-lg z-50 p-4">
          <h4 className="font-bold text-[15px] mb-2">
            {showConfirm === 'close' ? 'Close this venture?' : 'Delete this venture?'}
          </h4>
          <p className="text-[13px] text-ink-2 mb-4">
            {showConfirm === 'close'
              ? `This will mark "${ventureName}" as closed. Your story will remain visible.`
              : `This will permanently delete "${ventureName}" and all its data. This cannot be undone.`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowConfirm(null)}
              className="flex-1 px-3 py-2 border border-rule rounded-lg text-[13px] font-medium hover:bg-soft transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={showConfirm === 'close' ? handleClose : handleDelete}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-50 ${
                showConfirm === 'close' ? 'bg-warn hover:bg-warn/90' : 'bg-dead hover:bg-dead/90'
              }`}
            >
              {isLoading ? '...' : showConfirm === 'close' ? 'Close' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
