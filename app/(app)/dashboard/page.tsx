import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getVentureByFounderUserId } from '@/lib/services/ventures';
import { Header } from '@/components/ui';
import { SEGMENT_KEYS } from '@/lib/domain/rungs';

const SEGMENT_LABELS: Record<string, string> = {
  pitch: 'The Pitch',
  spark: 'The Spark',
  validation: 'Validation',
  audience: 'Building Audience',
  proto: 'First Prototype',
  build: 'The Build',
  beta: 'Beta Testing',
  gtm: 'Go-to-Market',
  launch: 'Launch',
  first: 'First Dollar',
  channel: 'Finding Channels',
  trouble: 'Trouble',
  money: 'Money',
  team: 'Team',
  scale: 'Scale',
  next: 'What Next',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const venture = await getVentureByFounderUserId(session.user.id);

  if (!venture) {
    redirect('/start');
  }

  const publishedSegments = SEGMENT_KEYS.filter(
    (key) => venture.segments && (venture.segments as Record<string, unknown>)[key]
  );
  const isDraft = venture.status === 'draft';

  return (
    <>
      <Header />

      <main className="max-w-[900px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <h1
              className="text-[32px] font-black tracking-tight"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              {venture.name}
            </h1>
            <p className="text-ink-2 text-[15px] mt-1">{venture.pitch}</p>
          </div>

          <div className="flex gap-3">
            {isDraft ? (
              <span className="px-3 py-1.5 rounded-full bg-warn-tint text-warn text-[12px] font-semibold">
                Draft
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-go-tint text-go-deep text-[12px] font-semibold">
                Live
              </span>
            )}
            <Link
              href={`/v/${venture.slug}`}
              className="text-[13px] text-ink-2 hover:text-ink"
            >
              View public page →
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="bg-soft border border-rule rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-3 font-semibold">
              Week
            </div>
            <div className="text-[28px] font-bold font-mono mt-1">
              {venture.counters.weekNumber}
            </div>
          </div>
          <div className="bg-soft border border-rule rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-3 font-semibold">
              Followers
            </div>
            <div className="text-[28px] font-bold font-mono mt-1">
              {venture.counters.followers}
            </div>
          </div>
          <div className="bg-soft border border-rule rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-3 font-semibold">
              Segments
            </div>
            <div className="text-[28px] font-bold font-mono mt-1">
              {publishedSegments.length}/16
            </div>
          </div>
          <div className="bg-soft border border-rule rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-3 font-semibold">
              Clips
            </div>
            <div className="text-[28px] font-bold font-mono mt-1">
              {venture.counters.clips}
            </div>
          </div>
        </div>

        {/* Draft banner */}
        {isDraft && (
          <div className="bg-warn-tint border border-warn/30 rounded-xl p-5 mb-8">
            <h3 className="font-semibold text-warn">Your venture is in draft mode</h3>
            <p className="text-[14px] text-ink-2 mt-1">
              Fill in at least one segment and click publish to make it visible to the world.
            </p>
            <form action={`/api/ventures/${venture._id}/publish`} method="POST" className="mt-4">
              <button
                type="submit"
                disabled={publishedSegments.length === 0}
                className="bg-warn text-white font-semibold px-5 py-2 rounded-full text-[13px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9A6A1A] transition-colors"
              >
                Publish venture
              </button>
            </form>
          </div>
        )}

        {/* Edit sections */}
        <div className="space-y-6">
          {/* Basics */}
          <section className="bg-page border border-rule rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold">Basics</h2>
              <Link
                href={`/v/${venture.slug}/edit`}
                className="text-[13px] text-go-deep hover:underline"
              >
                Edit
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[14px]">
              <div>
                <span className="text-ink-3">Name:</span>{' '}
                <span className="font-medium">{venture.name}</span>
              </div>
              <div>
                <span className="text-ink-3">Stage:</span>{' '}
                <span className="font-medium capitalize">{venture.rung}</span>
              </div>
              <div>
                <span className="text-ink-3">Problem:</span>{' '}
                <span className="font-medium">{venture.problem || '—'}</span>
              </div>
              <div>
                <span className="text-ink-3">Who:</span>{' '}
                <span className="font-medium">{venture.who || '—'}</span>
              </div>
            </div>
          </section>

          {/* Segments */}
          <section className="bg-page border border-rule rounded-xl p-6">
            <h2 className="text-[18px] font-bold mb-4">Journey segments</h2>
            <div className="grid grid-cols-2 gap-3">
              {SEGMENT_KEYS.map((key) => {
                const hasContent = venture.segments && (venture.segments as Record<string, unknown>)[key];
                return (
                  <Link
                    key={key}
                    href={`/v/${venture.slug}/edit?segment=${key}`}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-colors
                      ${hasContent
                        ? 'border-go bg-go-tint/50 hover:bg-go-tint'
                        : 'border-rule hover:border-ink-3 hover:bg-soft'
                      }
                    `}
                  >
                    <span className="text-[14px] font-medium">{SEGMENT_LABELS[key]}</span>
                    {hasContent ? (
                      <span className="text-go-deep text-[12px]">✓</span>
                    ) : (
                      <span className="text-ink-3 text-[12px]">Add →</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
