import Link from 'next/link';
import { Header } from '@/components/ui';
import { STAGES, getQuestionsByStage } from '@/lib/domain/questions';

export const metadata = {
  title: 'Questions — Vibed',
  description: 'The 16 questions every founder answers. Real answers from real journeys.',
};

export default function AnswersPage() {
  return (
    <>
      <Header />

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        <h1
          className="text-[clamp(28px,4vw,40px)] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          The questions every founder answers
        </h1>
        <p className="text-[17px] text-ink-2 mt-3 max-w-[56ch]">
          Sixteen fixed questions, from idea to exit. Watch founders answer the same questions at
          different stages — and see what changes.
        </p>

        <div className="mt-10">
          {STAGES.map((stage) => {
            const questions = getQuestionsByStage(stage);

            return (
              <div key={stage} className="mb-[34px]">
                <h3 className="text-[13px] tracking-[0.1em] uppercase text-ink-3 font-bold mb-[14px] flex items-center gap-[10px]">
                  {stage}
                  <span className="flex-1 h-px bg-rule" />
                </h3>

                <div className="grid md:grid-cols-2 gap-[14px]">
                  {questions.map((q) => (
                    <Link
                      key={q.slug}
                      href={`/q/${q.slug}`}
                      className="flex items-center gap-[14px] bg-page border border-rule rounded-xl p-[15px_17px] transition-all hover:border-ink hover:translate-x-[3px]"
                    >
                      <span className="font-display text-[16px] font-bold leading-[1.3] flex-1">
                        {q.q}
                      </span>
                      <span className="font-mono text-[11.5px] text-ink-3 whitespace-nowrap">
                        {/* Clip count will be dynamic */}
                        —
                      </span>
                      <span className="text-go-deep font-bold">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
