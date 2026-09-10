'use client';

import { useState, useRef, useEffect } from 'react';

interface ShareButtonProps {
  url?: string;
  title: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'icon';
}

export function ShareButton({
  url,
  title,
  description = '',
  className = '',
  variant = 'default',
}: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get current URL if not provided
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowDropdown(false);
      }, 1500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowDropdown(false);
      }, 1500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        setShowDropdown(false);
      } catch {
        // User cancelled or error
      }
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${title}${description ? ` - ${description}` : ''}`);
    const shareUrlEncoded = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrlEncoded}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400'
    );
    setShowDropdown(false);
  };

  const shareToLinkedIn = () => {
    const shareUrlEncoded = encodeURIComponent(shareUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400'
    );
    setShowDropdown(false);
  };

  const shareToFacebook = () => {
    const shareUrlEncoded = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`,
      '_blank',
      'noopener,noreferrer,width=600,height=400'
    );
    setShowDropdown(false);
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          ${variant === 'icon'
            ? 'w-9 h-9 rounded-full flex items-center justify-center bg-soft hover:bg-rule transition-colors'
            : 'text-[13px] font-semibold border border-rule-2 px-6 py-2 rounded-lg hover:border-ink hover:bg-soft transition-colors'
          }
          ${className}
        `}
        title="Share"
      >
        {variant === 'icon' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        ) : (
          'Share'
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 bg-page border border-rule rounded-xl shadow-lg py-2 z-50 min-w-[180px]"
        >
          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-soft flex items-center gap-3 transition-colors"
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-go">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-go font-semibold">Link copied!</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>Copy link</span>
              </>
            )}
          </button>

          {/* Native share (mobile) */}
          {supportsNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-soft flex items-center gap-3 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>More options...</span>
            </button>
          )}

          <div className="border-t border-rule my-1" />

          {/* X/Twitter */}
          <button
            onClick={shareToTwitter}
            className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-soft flex items-center gap-3 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-ink-2">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Share on X</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={shareToLinkedIn}
            className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-soft flex items-center gap-3 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>Share on LinkedIn</span>
          </button>

          {/* Facebook */}
          <button
            onClick={shareToFacebook}
            className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-soft flex items-center gap-3 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#1877F2]">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Share on Facebook</span>
          </button>
        </div>
      )}
    </div>
  );
}
