import { notFound, redirect } from 'next/navigation';
import { Header, VentureLogo, RungTag, PromiseClock, Avatar } from '@/components/ui';
import { getVentureBySlug } from '@/lib/db/repos';
import { type SegmentKey } from '@/lib/db/models';

// Segment definitions
const SEGMENTS: { k: SegmentKey; t: string; p: string }[] = [
  { k: 'pitch', t: 'The elevator pitch', p: 'What it is, in thirty seconds.' },
  { k: 'spark', t: 'The spark', p: 'The moment the problem became worth solving.' },
  { k: 'validation', t: 'Validation', p: 'Who you talked to before building anything.' },
  { k: 'audience', t: 'Building an audience', p: 'The waitlist, the shortlist, the first people watching.' },
  { k: 'proto', t: 'Prototype', p: 'The first ugly version.' },
  { k: 'build', t: 'Development', p: 'Building the real thing.' },
  { k: 'beta', t: 'Private beta', p: 'First testers and what they broke.' },
  { k: 'gtm', t: 'Go to market', p: 'Kickstarter, pre-orders, launch strategy.' },
  { k: 'launch', t: 'Launch day', p: 'What actually happened.' },
  { k: 'first', t: 'First sale', p: 'The first time a stranger paid.' },
  { k: 'channel', t: 'Finding a channel', p: 'The thing that started working repeatedly.' },
  { k: 'trouble', t: 'What nearly killed it', p: 'The setback you did not see coming.' },
  { k: 'money', t: 'Money and runway', p: 'How you are paying for this.' },
  { k: 'team', t: 'Getting help', p: 'First hire, contractor or co-founder.' },
  { k: 'scale', t: 'Small to big', p: 'What broke when it grew.' },
  { k: 'next', t: 'What is next', p: 'The part not written yet.' },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VentureProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const venture = await getVentureBySlug(slug);

  if (!venture) {
    notFound();
  }

  // Handle slug redirects
  if ('_redirect' in venture && venture._redirect) {
    redirect(`/v/${venture._redirect}`);
  }

  const isDead = venture.status === 'closed';
  const isGraduated = venture.status === 'graduated';

  // Get segments
  const segments = venture.segments || {};

  return (
    <>
      <Header />

      {/* Banner */}
      <div
        className="relative h-[300px] overflow-hidden border-b border-rule bg-soft"
        style={{
          background: `linear-gradient(135deg, ${venture.brand}33 0%, transparent 50%, ${venture.brand}11 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/5" />
      </div>

      <div className="max-w-[1180px] mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_344px] gap-11 items-start pb-20">
          {/* Main content */}
          <div>
            {/* Profile identity */}
            <div className="flex gap-[18px] items-end -mt-10 relative z-[4]">
              <VentureLogo
                glyph={venture.glyph}
                brand={venture.brand}
                size="lg"
                className="border-4 border-bg shadow-lg"
              />
              <h1
                className="text-[38px] font-black tracking-tight pb-1"
                style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
              >
                {venture.name}
              </h1>
            </div>

            <p className="text-[17px] text-ink-2 mt-3 max-w-[56ch]">{venture.pitch}</p>

            {/* Meta line */}
            <div className="flex items-center gap-[10px] mt-[14px] text-[14px] text-ink-2 flex-wrap">
              <RungTag rung={venture.rung} isDead={isDead} />
              <span className="text-rule-2">·</span>
              <span>Week {venture.counters.weekNumber}</span>
              <span className="text-rule-2">·</span>
              <span>{venture.counters.followers.toLocaleString()} followers</span>
              {isDead && (
                <>
                  <span className="text-rule-2">·</span>
                  <span className="text-dead font-medium">Closed</span>
                </>
              )}
              {isGraduated && (
                <>
                  <span className="text-rule-2">·</span>
                  <span className="text-go-deep font-medium">Graduated</span>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-7 border-b border-rule mt-[26px]">
              {['Pitch', 'Journey', 'Media'].map((tab, i) => (
                <button
                  key={tab}
                  className={`text-[14.5px] font-semibold py-[13px] border-b-2 -mb-px ${
                    i === 0
                      ? 'text-ink border-go'
                      : 'text-ink-3 border-transparent hover:text-ink'
                  }`}
                >
                  {tab}
                  {tab === 'Media' && (
                    <span className="font-mono text-[11px] text-ink-3 ml-[5px]">
                      {venture.counters.clips}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content blocks */}
            <div className="pt-7 max-w-[660px]">
              {/* Problem / Who / Why */}
              {venture.problem && (
                <div className="mb-[26px]">
                  <h3 className="text-[12px] tracking-[0.11em] uppercase text-ink-3 font-bold mb-[7px]">
                    The problem
                  </h3>
                  <p className="text-[16.5px] leading-relaxed">{venture.problem}</p>
                </div>
              )}

              {venture.who && (
                <div className="mb-[26px]">
                  <h3 className="text-[12px] tracking-[0.11em] uppercase text-ink-3 font-bold mb-[7px]">
                    Who it&apos;s for
                  </h3>
                  <p className="text-[16.5px] leading-relaxed">{venture.who}</p>
                </div>
              )}

              {venture.why && (
                <div className="mb-[26px]">
                  <h3 className="text-[12px] tracking-[0.11em] uppercase text-ink-3 font-bold mb-[7px]">
                    Why them
                  </h3>
                  <p className="text-[16.5px] leading-relaxed">{venture.why}</p>
                </div>
              )}

              <div className="h-px bg-rule mt-[34px] max-w-[660px]" />

              {/* Segments */}
              <div className="pt-6 max-w-[660px]">
                {SEGMENTS.map((seg, index) => {
                  const content = segments instanceof Map ? segments.get(seg.k) : segments[seg.k];
                  const hasContent = content?.body;
                  const isLocked = !hasContent;

                  return (
                    <div
                      key={seg.k}
                      className={`border-t border-rule py-5 grid grid-cols-[34px_1fr] gap-4 ${
                        index === 0 ? 'border-t-0' : ''
                      } ${isLocked ? 'opacity-45' : ''}`}
                    >
                      <div className="font-mono text-[12px] text-ink-3 pt-[5px] font-medium">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <h4 className={`text-[19px] font-bold ${isLocked ? 'font-semibold' : ''}`}>
                          {seg.t}
                        </h4>
                        <p className="text-[12.5px] text-ink-3 mt-[2px]">{seg.p}</p>
                        {hasContent ? (
                          <p className="text-[16px] leading-relaxed text-ink-2 mt-[9px]">
                            {content.body}
                          </p>
                        ) : (
                          <p className="text-[14.5px] italic text-ink-3 mt-[9px]">
                            Not written yet
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-[132px] flex flex-col gap-4 pt-8 lg:pt-0 lg:-mt-10">
            {/* Promise card */}
            {venture.promise && !isDead && (
              <div className="bg-page border border-rule rounded-[14px] p-[18px] shadow-sm">
                <PromiseClock
                  text={venture.promise.text}
                  dueAt={venture.promise.dueAt}
                  createdAt={venture.promise.createdAt}
                  keptHistory={venture.promiseHistory?.map((p) => p.kept) || []}
                  className="mt-0 bg-transparent border-0 p-0"
                />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-[14px] mt-4 pt-4 border-t border-rule">
                  <div>
                    <div className="font-display font-bold text-[21px] tracking-tight">
                      {venture.counters.weekNumber}
                    </div>
                    <div className="text-[11.5px] text-ink-3">Week</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-[21px] tracking-tight">
                      {venture.counters.streakWeeks}
                    </div>
                    <div className="text-[11.5px] text-ink-3">Week streak</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-[21px] tracking-tight">
                      {venture.counters.followers.toLocaleString()}
                    </div>
                    <div className="text-[11.5px] text-ink-3">Followers</div>
                  </div>
                  <div>
                    <div className="font-display font-bold text-[21px] tracking-tight">
                      {venture.counters.clips}
                    </div>
                    <div className="text-[11.5px] text-ink-3">Clips</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-[11px]">
                  <button className="flex-1 text-[13px] font-semibold border border-rule-2 rounded-full py-[9px] text-ink-2 hover:border-ink hover:text-ink transition-colors">
                    Follow
                  </button>
                  <button className="flex-1 text-[13px] font-semibold border border-rule-2 rounded-full py-[9px] text-ink-2 hover:border-ink hover:text-ink transition-colors">
                    Share
                  </button>
                </div>
              </div>
            )}

            {/* Founder card */}
            <div className="bg-page border border-rule rounded-[14px] p-[18px] shadow-sm">
              <div className="flex gap-3 items-start">
                <Avatar name={venture.founder.name} color={venture.brand} size="lg" />
                <div>
                  <div className="font-display text-[17px] font-bold">{venture.founder.name}</div>
                  {venture.founder.location && (
                    <div className="text-[12.5px] text-ink-3">{venture.founder.location}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Links card */}
            {venture.links?.site && (
              <div className="bg-page border border-rule rounded-[14px] p-[18px] shadow-sm">
                <div className="text-[10.5px] tracking-[0.11em] uppercase text-ink-3 font-bold mb-[11px]">
                  Links
                </div>
                <a
                  href={`https://${venture.links.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full bg-ink text-white rounded-xl p-[14px_15px] hover:bg-go-deep transition-colors"
                >
                  <div className="w-[34px] h-[34px] rounded-lg bg-white/15 grid place-items-center">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <b className="block text-[15px] font-semibold truncate">{venture.links.site}</b>
                    <span className="text-[11.5px] text-white/60">
                      {venture.links.siteStatus === 'live'
                        ? 'Live'
                        : venture.links.siteStatus === 'waitlist'
                        ? 'Waitlist'
                        : venture.links.siteStatus === 'closed'
                        ? 'Closed'
                        : ''}
                    </span>
                  </div>
                  <span className="ml-auto text-white/70">→</span>
                </a>

                {/* Social links */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {venture.links.ig && (
                    <a
                      href={`https://instagram.com/${venture.links.ig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-[7px] border border-rule rounded-full px-3 py-[7px] text-[12px] text-ink-2 font-medium hover:border-ink hover:text-ink hover:bg-soft transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      @{venture.links.ig}
                    </a>
                  )}
                  {venture.links.x && (
                    <a
                      href={`https://x.com/${venture.links.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-[7px] border border-rule rounded-full px-3 py-[7px] text-[12px] text-ink-2 font-medium hover:border-ink hover:text-ink hover:bg-soft transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      @{venture.links.x}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Standards card */}
            {venture.standards && (
              <div className="border border-go-tint bg-go-tint rounded-[14px] p-[16px_18px]">
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-go-deep">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  Standards: {venture.standards.met}/{venture.standards.of}
                </div>
                <ul className="mt-[10px] flex flex-col gap-[5px]">
                  {['Has a pitch', 'Has segments', 'Active promise', 'Posted this week'].map(
                    (item, i) => (
                      <li
                        key={item}
                        className="text-[12.5px] text-go-deep flex gap-2 opacity-90"
                      >
                        <em className="not-italic">{i < venture.standards.met ? '✓' : '○'}</em>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const venture = await getVentureBySlug(slug);

  if (!venture) {
    return { title: 'Not Found' };
  }

  return {
    title: `${venture.name} — Vibed`,
    description: venture.pitch,
  };
}
