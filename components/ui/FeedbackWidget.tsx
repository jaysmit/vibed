'use client';

import { useState, useRef, useCallback } from 'react';
import type { FeedbackType, BrowserInfo } from '@/lib/supabase/types';

const FEEDBACK_TYPES: { key: FeedbackType; label: string; icon: string; description: string }[] = [
  { key: 'bug', label: 'Bug Report', icon: '🐛', description: 'Something isn\'t working' },
  { key: 'feature', label: 'Feature Request', icon: '✨', description: 'Suggest an improvement' },
  { key: 'general', label: 'General Feedback', icon: '💬', description: 'Share your thoughts' },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'form' | 'success'>('type');
  const [type, setType] = useState<FeedbackType | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get browser info
  const getBrowserInfo = useCallback((): BrowserInfo => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = '';

    if (ua.includes('Firefox/')) {
      browser = 'Firefox';
      version = ua.split('Firefox/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      browser = 'Chrome';
      version = ua.split('Chrome/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
      browser = 'Safari';
      version = ua.split('Version/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Edg/')) {
      browser = 'Edge';
      version = ua.split('Edg/')[1]?.split(' ')[0] || '';
    }

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const device = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop';
    const screen = `${window.screen.width}x${window.screen.height}`;

    return { browser, version, os, device, screen };
  }, []);

  // Handle screenshot upload
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !subject.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          content: content.trim(),
          screenshotUrl: screenshot, // Base64 for now, could upload to storage
          pageUrl: window.location.href,
          browserInfo: getBrowserInfo(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    }

    setIsSubmitting(false);
  };

  // Reset form
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep('type');
      setType(null);
      setSubject('');
      setContent('');
      setScreenshot(null);
      setError('');
    }, 200);
  };

  const handleSelectType = (t: FeedbackType) => {
    setType(t);
    setStep('form');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-ink text-white rounded-full shadow-lg hover:bg-ink/90 transition-all hover:scale-105 flex items-center justify-center group"
        title="Send feedback"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="absolute right-full mr-3 px-2 py-1 bg-ink text-white text-[12px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Send feedback
        </span>
      </button>

      {/* Modal backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Modal */}
          <div
            className="bg-page rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-rule">
              <h2 className="text-[18px] font-bold">
                {step === 'type' && 'Send Feedback'}
                {step === 'form' && FEEDBACK_TYPES.find((t) => t.key === type)?.label}
                {step === 'success' && 'Thank You!'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 text-ink-3 hover:text-ink transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-70px)]">
              {/* Step 1: Select type */}
              {step === 'type' && (
                <div className="space-y-3">
                  <p className="text-[14px] text-ink-2 mb-4">
                    What would you like to share?
                  </p>
                  {FEEDBACK_TYPES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => handleSelectType(t.key)}
                      className="w-full flex items-center gap-4 p-4 bg-soft rounded-xl hover:bg-rule transition-colors text-left"
                    >
                      <span className="text-[24px]">{t.icon}</span>
                      <div>
                        <div className="font-semibold text-[15px]">{t.label}</div>
                        <div className="text-[13px] text-ink-3">{t.description}</div>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="ml-auto text-ink-3"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Form */}
              {step === 'form' && type && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setStep('type')}
                    className="text-[13px] text-ink-3 hover:text-ink flex items-center gap-1 mb-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back
                  </button>

                  <div>
                    <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
                      Subject <span className="text-dead">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={
                        type === 'bug'
                          ? 'Brief description of the issue'
                          : type === 'feature'
                          ? 'What would you like to see?'
                          : 'What\'s on your mind?'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                      maxLength={200}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
                      Details <span className="text-dead">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={
                        type === 'bug'
                          ? 'What happened? What did you expect to happen? Steps to reproduce...'
                          : type === 'feature'
                          ? 'Describe the feature and why it would be useful...'
                          : 'Share your thoughts...'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none min-h-[120px]"
                      maxLength={5000}
                      required
                    />
                    <div className="text-[11px] text-ink-3 mt-1 text-right">
                      {content.length}/5000
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div>
                    <label className="block text-[13px] font-medium text-ink-2 mb-1.5">
                      Screenshot (optional)
                    </label>
                    {screenshot ? (
                      <div className="relative">
                        <img
                          src={screenshot}
                          alt="Screenshot"
                          className="w-full rounded-xl border border-rule"
                        />
                        <button
                          type="button"
                          onClick={() => setScreenshot(null)}
                          className="absolute top-2 right-2 p-1 bg-dead text-white rounded-full hover:bg-dead/90"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6 border-2 border-dashed border-rule rounded-xl text-center hover:border-ink/30 transition-colors"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="mx-auto mb-2 text-ink-3"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-[13px] text-ink-2">Click to add screenshot</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-dead-tint text-dead text-[13px] rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !subject.trim() || !content.trim()}
                    className="w-full py-3 bg-go text-[#00301E] font-semibold rounded-xl hover:bg-[#04B76B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>

                  <p className="text-[11px] text-ink-3 text-center">
                    We&apos;ll include your current page and browser info to help us investigate.
                  </p>
                </form>
              )}

              {/* Step 3: Success */}
              {step === 'success' && (
                <div className="text-center py-6">
                  <div className="text-[48px] mb-4">🎉</div>
                  <h3 className="text-[20px] font-bold mb-2">Thanks for your feedback!</h3>
                  <p className="text-[14px] text-ink-2 mb-6">
                    We appreciate you taking the time to help us improve Vibed.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-ink text-white font-semibold rounded-lg hover:bg-ink/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
