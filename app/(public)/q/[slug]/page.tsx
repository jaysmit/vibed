import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header, VentureLogo, Avatar } from '@/components/ui';
import { getClipsByQuestion } from '@/lib/db/repos';
import { getQuestion, QUESTIONS } from '@/lib/domain/questions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params;
  const question = getQuestion(slug);

  if (!question) {
    notFound();
  }

  const clips = await getClipsByQuestion(slug);

  // Get adjacent questions for navigation
  const currentIndex = QUESTIONS.findIndex((q) => q.slug === slug);
  const prevQuestion = currentIndex > 0 ? QUESTIONS[currentIndex - 1] : null;
  const nextQuestion = currentIndex < QUESTIONS.length - 1 ? QUESTIONS[currentIndex + 1] : null;

  return (
    <>
      <Header />

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <Link href="/answers" className="text-[13.5px] text-ink-3 hover:text-ink">
          ← All questions
        </Link>

        <div className="mt-6">
          <div className="text-[11px] tracking-[0.13em] uppercase font-bold text-go-deep mb-2">
            {question.stage}
          </div>
          <h1
            className="text-[clamp(26px,3.5vw,36px)] font-black tracking-tight max-w-[20ch]"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            {question.q}
          </h1>
          <p className="text-[15px] text-ink-3 mt-3">
            {clips.length} {clips.length === 1 ? 'founder has' : 'founders have'} answered this
            question
          </p>
        </div>

        {/* Clips grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mt-10">
          {clips.map((clip) => (
            <article
              key={clip._id?.toString()}
              className="cursor-pointer group"
            >
              {/* Poster */}
              <div
                className="relative h-[210px] rounded-xl overflow-hidden border border-rule bg-soft"
                style={{
                  background: `linear-gradient(135deg, ${clip.venture.brand}22 0%, transparent 60%)`,
                }}
              >
                {/* Play button */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 grid place-items-center shadow-lg z-[3] group-hover:scale-110 transition-transform">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0E0E0E">
                    <path d="M7 4.5l13 7.5-13 7.5z" />
                  </svg>
                </div>

                {/* Duration */}
                <div className="absolute right-[10px] bottom-[10px] z-[3] bg-black/70 text-white font-mono text-[11px] font-medium px-2 py-[3px] rounded">
                  {Math.floor(clip.durationSec / 60)}:{String(clip.durationSec % 60).padStart(2, '0')}
                </div>

                {/* Logo */}
                <div className="absolute left-3 bottom-3 z-[3]">
                  <VentureLogo glyph={clip.venture.glyph} brand={clip.venture.brand} size="sm" />
                </div>
              </div>

              {/* Caption */}
              <h3 className="text-[13px] font-semibold mt-[9px] leading-[1.35] group-hover:underline">
                {clip.title || clip.tagline || question.q}
              </h3>

              {/* Who */}
              <div className="text-[12px] text-ink-3 mt-1 flex items-center gap-[6px]">
                <Avatar name={clip.founder.name} color={clip.venture.brand} size="sm" />
                <span>{clip.founder.name}</span>
                <span className="text-rule-2">·</span>
                <Link href={`/v/${clip.venture.slug}`} className="hover:text-ink">
                  {clip.venture.name}
                </Link>
              </div>
            </article>
          ))}
        </div>

        {clips.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="text-[60px] opacity-20 mb-4">🎬</div>
            <h2 className="text-[24px] font-extrabold font-display">No answers yet</h2>
            <p className="text-ink-2 mt-2">
              Be the first founder to answer this question.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-16 pt-8 border-t border-rule">
          {prevQuestion ? (
            <Link
              href={`/q/${prevQuestion.slug}`}
              className="text-[14px] text-ink-3 hover:text-ink"
            >
              ← {prevQuestion.q.slice(0, 40)}...
            </Link>
          ) : (
            <span />
          )}
          {nextQuestion && (
            <Link
              href={`/q/${nextQuestion.slug}`}
              className="text-[14px] text-go-deep hover:underline"
            >
              {nextQuestion.q.slice(0, 40)}... →
            </Link>
          )}
        </div>
      </main>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const question = getQuestion(slug);

  if (!question) {
    return { title: 'Not Found' };
  }

  return {
    title: `${question.q} — Vibed`,
    description: `Watch founders answer: ${question.q}`,
  };
}
