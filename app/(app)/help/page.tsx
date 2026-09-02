import Link from 'next/link';

const FAQ_ITEMS = [
  {
    q: 'What is Vibed?',
    a: 'Vibed is a platform for following founders from week one. Founders publish their venture journey, make public promises, and post short videos. Readers discover and follow ventures they believe in.',
  },
  {
    q: 'How do I start a venture?',
    a: 'Click "Start your venture" in the header. You\'ll be guided through naming your venture, adding team members (optional), selecting a location, and choosing categories. After that, you can fill in your story and publish.',
  },
  {
    q: 'What are segments?',
    a: 'Segments are the 16 chapters of your founder journey — from "The Spark" (your origin story) to "What\'s Next" (your future plans). You don\'t need to fill them all at once. Write them as your venture progresses.',
  },
  {
    q: 'What are promises?',
    a: 'Promises are public commitments with deadlines. They help keep you accountable and let followers track your progress. When you keep a promise, it builds trust. When you break one, be honest about why.',
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
    q: 'How do I add team members?',
    a: 'During venture creation or from your venture settings, you can invite team members by searching for existing Vibed users or adding new people via email. They\'ll receive an invitation link to join.',
  },
  {
    q: 'What happens if my venture fails?',
    a: 'You can mark your venture as "Closed" from the settings menu. Your story will remain visible as a postmortem — failures teach as much as successes, and we believe in preserving that history.',
  },
];

export default function HelpPage() {
  return (
    <main className="max-w-[800px] mx-auto px-6 py-10">
      <h1
        className="text-[32px] font-black tracking-tight mb-2"
        style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
      >
        Help & FAQ
      </h1>
      <p className="text-ink-2 text-[15px] mb-10">
        Common questions about using Vibed.
      </p>

      {/* FAQ */}
      <div className="space-y-4 mb-12">
        {FAQ_ITEMS.map((item, i) => (
          <details key={i} className="group bg-page border border-rule rounded-xl overflow-hidden">
            <summary className="cursor-pointer list-none p-5 flex items-center justify-between hover:bg-soft transition-colors">
              <span className="font-semibold text-[15px] pr-4">{item.q}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-ink-3 flex-shrink-0 transition-transform group-open:rotate-180"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="px-5 pb-5 text-[14px] text-ink-2 leading-relaxed border-t border-rule pt-4">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-soft border border-rule rounded-xl p-6">
        <h2 className="text-[18px] font-bold mb-2">Still have questions?</h2>
        <p className="text-[14px] text-ink-2 mb-4">
          We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as we can.
        </p>
        <a
          href="mailto:hello@vibed.com"
          className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-5 py-2.5 rounded-full text-[14px] hover:bg-go-deep transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Contact support
        </a>
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
      </div>
    </main>
  );
}
