'use client';

import { useState } from 'react';
import Link from 'next/link';

const FAQ_CATEGORIES = [
  {
    name: 'Getting Started',
    icon: '🚀',
    items: [
      {
        q: 'What is Vibed?',
        a: 'Vibed is a platform for following founders from week one. Founders publish their venture journey, make public promises, and post short videos. Readers discover and follow ventures they believe in.',
      },
      {
        q: 'How do I start a venture?',
        a: 'Click "Start your venture" in the header. You\'ll be guided through naming your venture, adding team members (optional), selecting a location, and choosing categories. After that, you can fill in your story and publish.',
      },
      {
        q: 'Is Vibed free?',
        a: 'Yes! Vibed is free to use for founders and followers. We believe in supporting early-stage founders without adding financial burden.',
      },
    ],
  },
  {
    name: 'Your Venture',
    icon: '💼',
    items: [
      {
        q: 'What are segments?',
        a: 'Segments are the 16 chapters of your founder journey — from "The Spark" (your origin story) to "What\'s Next" (your future plans). You don\'t need to fill them all at once. Write them as your venture progresses.',
      },
      {
        q: 'How does publishing work?',
        a: 'Your venture starts as a draft (only visible to you). Once you\'ve completed your profile basics (name, pitch, categories, location, problem, who, and why), you can publish to make it visible to everyone.',
      },
      {
        q: 'Can I have multiple ventures?',
        a: 'Yes! You can create and manage multiple ventures from your dashboard. Each venture has its own profile, segments, and followers.',
      },
      {
        q: 'What happens if my venture fails?',
        a: 'You can mark your venture as "Closed" from the settings menu. Your story will remain visible as a postmortem — failures teach as much as successes, and we believe in preserving that history.',
      },
    ],
  },
  {
    name: 'Promises & Accountability',
    icon: '🎯',
    items: [
      {
        q: 'What are promises?',
        a: 'Promises are public commitments with deadlines. They help keep you accountable and let followers track your progress. When you keep a promise, it builds trust. When you break one, be honest about why.',
      },
      {
        q: 'What happens if I miss a promise?',
        a: 'Nothing bad! We all miss deadlines sometimes. Mark it as missed and optionally explain why. Your followers will appreciate the honesty.',
      },
      {
        q: 'How often should I make promises?',
        a: 'There\'s no requirement. Make promises when you have specific, measurable goals you want to commit to publicly. Quality over quantity.',
      },
    ],
  },
  {
    name: 'Clips & Videos',
    icon: '🎬',
    items: [
      {
        q: 'What are clips?',
        a: 'Clips are short video updates (under 60 seconds) where you answer specific questions about your journey. They help followers connect with you personally and understand your story better.',
      },
      {
        q: 'What format should my videos be?',
        a: 'We recommend vertical (9:16) or square (1:1) videos. MP4 format works best. Keep them under 60 seconds for maximum engagement.',
      },
      {
        q: 'Can I add captions to my clips?',
        a: 'Yes! We automatically transcribe your clips. The transcript is shown alongside the video and helps with accessibility and discoverability.',
      },
    ],
  },
  {
    name: 'Team & Collaboration',
    icon: '👥',
    items: [
      {
        q: 'How do I add team members?',
        a: 'During venture creation or from your venture settings, you can invite team members by searching for existing Vibed users or adding new people via email. They\'ll receive an invitation link to join.',
      },
      {
        q: 'What roles can team members have?',
        a: 'Team members can be added as Partners or Team Members. Partners have editing access while Team Members can view and comment.',
      },
      {
        q: 'Can I remove someone from my team?',
        a: 'Yes, go to your venture settings and you can remove team members at any time.',
      },
    ],
  },
  {
    name: 'Following & Discovery',
    icon: '🔍',
    items: [
      {
        q: 'How do I find ventures to follow?',
        a: 'Use the Discover page to browse ventures. You can filter by industry, stage, or content type to find ventures that interest you.',
      },
      {
        q: 'What does endorsing a clip mean?',
        a: 'Endorsing is like a "like" but more meaningful. You can optionally add a reason (honest about failure, useful tactics, etc.) to show why the clip resonated with you.',
      },
      {
        q: 'How do I see updates from ventures I follow?',
        a: 'Check the Following page in your dashboard. You can also enable email notifications in your settings to get weekly digests.',
      },
    ],
  },
  {
    name: 'Account & Settings',
    icon: '⚙️',
    items: [
      {
        q: 'How do I change my email or password?',
        a: 'Go to Settings > Account Settings. You can update your email (requires confirmation) and change your password.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings and scroll to the Danger Zone. Note that deleting your account will also remove all your ventures and content.',
      },
      {
        q: 'Can I change my profile URL?',
        a: 'Profile URLs (vibed.app/founder/your-slug) are permanent to ensure links don\'t break. Contact support if you have a special case.',
      },
    ],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Filter FAQs based on search
  const filteredCategories = FAQ_CATEGORIES.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  const hasResults = filteredCategories.length > 0;

  return (
    <main className="max-w-[800px] mx-auto px-6 py-10">
      <h1
        className="text-[32px] font-black tracking-tight mb-2"
        style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
      >
        Help Centre
      </h1>
      <p className="text-ink-2 text-[15px] mb-8">
        Find answers to common questions or get in touch.
      </p>

      {/* Search */}
      <div className="relative mb-8">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* FAQ Categories */}
      {hasResults ? (
        <div className="space-y-4 mb-12">
          {filteredCategories.map((category) => (
            <div key={category.name} className="bg-page border border-rule rounded-xl overflow-hidden">
              <button
                onClick={() =>
                  setExpandedCategory(expandedCategory === category.name ? null : category.name)
                }
                className="w-full p-4 flex items-center gap-3 hover:bg-soft transition-colors"
              >
                <span className="text-[20px]">{category.icon}</span>
                <span className="font-semibold text-[16px] flex-1 text-left">{category.name}</span>
                <span className="text-[13px] text-ink-3 mr-2">{category.items.length} questions</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-ink-3 transition-transform ${
                    expandedCategory === category.name || searchQuery ? 'rotate-180' : ''
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {(expandedCategory === category.name || searchQuery) && (
                <div className="border-t border-rule">
                  {category.items.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between hover:bg-soft transition-colors border-b border-rule last:border-b-0">
                        <span className="text-[14px] pr-4">{item.q}</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-ink-3 flex-shrink-0 transition-transform group-open:rotate-180"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </summary>
                      <div className="px-5 py-4 text-[14px] text-ink-2 leading-relaxed bg-soft">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 mb-12">
          <div className="text-[48px] mb-4">🤔</div>
          <h3 className="text-[18px] font-bold mb-2">No results found</h3>
          <p className="text-[14px] text-ink-2 mb-4">
            Try a different search term or browse the categories above.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-[14px] text-go-deep hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Contact / Feedback */}
      <div className="bg-soft border border-rule rounded-xl p-6">
        <h2 className="text-[18px] font-bold mb-2">Still need help?</h2>
        <p className="text-[14px] text-ink-2 mb-4">
          Can&apos;t find what you&apos;re looking for? Use the feedback button in the bottom-right corner to:
        </p>
        <ul className="text-[14px] text-ink-2 space-y-2 mb-4">
          <li className="flex items-center gap-2">
            <span className="text-[16px]">🐛</span>
            Report a bug or issue
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[16px]">✨</span>
            Request a feature
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[16px]">💬</span>
            Send general feedback
          </li>
        </ul>
        <p className="text-[13px] text-ink-3">
          You can also email us directly at{' '}
          <a href="mailto:hello@vibed.app" className="text-go-deep hover:underline">
            hello@vibed.app
          </a>
        </p>
      </div>

      {/* Quick links */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/discover" className="text-[14px] text-go-deep hover:underline">
          Browse ventures →
        </Link>
        <Link href="/start" className="text-[14px] text-go-deep hover:underline">
          Start a venture →
        </Link>
        <Link href="/dashboard" className="text-[14px] text-go-deep hover:underline">
          Go to dashboard →
        </Link>
        <Link href="/privacy" className="text-[14px] text-go-deep hover:underline">
          Privacy Policy →
        </Link>
        <Link href="/terms" className="text-[14px] text-go-deep hover:underline">
          Terms of Service →
        </Link>
      </div>
    </main>
  );
}
