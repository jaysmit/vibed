'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SEGMENT_KEYS, RUNGS } from '@/lib/domain/rungs';
import type { SegmentKey, Rung } from '@/lib/domain/rungs';
import { QUESTIONS } from '@/lib/domain/questions';
import { VideoUploader, VideoPlayer } from '@/components/ui';

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

const SEGMENT_PROMPTS: Record<string, string> = {
  pitch: 'Explain what you\'re building in plain language. No jargon, no hype.',
  spark: 'What made you start this? The specific moment or frustration that led here.',
  validation: 'How did you check if anyone actually wanted this?',
  audience: 'How are you finding and reaching the people who need this?',
  proto: 'What did the first version look like? How embarrassing was it?',
  build: 'The actual building process. What worked, what didn\'t.',
  beta: 'Early users and their feedback. The good and the brutal.',
  gtm: 'Your plan for getting this to market. Or lack thereof.',
  launch: 'The launch story. What happened when you went live.',
  first: 'Your first paying customer. How it happened.',
  channel: 'Finding repeatable ways to reach customers.',
  trouble: 'Things that went wrong. The setbacks.',
  money: 'The money side. Revenue, costs, funding.',
  team: 'Building a team, or staying solo.',
  scale: 'Growing beyond the early stage.',
  next: 'What comes next. Where this is heading.',
};

interface Clip {
  _id: string;
  questionSlug: string;
  title: string;
  playbackId: string;
  durationSec: number;
  transcriptStatus: 'pending' | 'ready' | 'failed';
  publishedAt?: string;
  createdAt: string;
}

interface Venture {
  _id: string;
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: Rung;
  problem?: string;
  who?: string;
  why?: string;
  segments: Record<string, { body: string }>;
  links: {
    site?: string;
    siteStatus?: string;
    ig?: string;
    x?: string;
    yt?: string;
    tiktok?: string;
  };
}

export default function EditVenturePage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const segmentParam = searchParams.get('segment') as SegmentKey | null;

  const [venture, setVenture] = useState<Venture | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'segment' | 'videos'>('basics');
  const [activeSegment, setActiveSegment] = useState<SegmentKey>(segmentParam || 'pitch');
  const [selectedQuestion, setSelectedQuestion] = useState<string>(QUESTIONS[0].slug);

  // Form state
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [problem, setProblem] = useState('');
  const [who, setWho] = useState('');
  const [why, setWhy] = useState('');
  const [rung, setRung] = useState<Rung>('idea');
  const [segmentBody, setSegmentBody] = useState('');

  useEffect(() => {
    if (segmentParam && SEGMENT_KEYS.includes(segmentParam as SegmentKey)) {
      setActiveTab('segment');
      setActiveSegment(segmentParam as SegmentKey);
    }
  }, [segmentParam]);

  useEffect(() => {
    async function loadVenture() {
      try {
        const res = await fetch('/api/ventures');
        const data = await res.json();
        if (data.venture) {
          setVenture(data.venture);
          setName(data.venture.name);
          setPitch(data.venture.pitch);
          setProblem(data.venture.problem || '');
          setWho(data.venture.who || '');
          setWhy(data.venture.why || '');
          setRung(data.venture.rung);
        } else {
          router.push('/start');
        }
      } catch {
        console.error('Failed to load venture');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadVenture();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (venture?.segments?.[activeSegment]) {
      setSegmentBody(venture.segments[activeSegment].body || '');
    } else {
      setSegmentBody('');
    }
  }, [activeSegment, venture]);

  const fetchClips = useCallback(async () => {
    if (!venture?._id) return;
    try {
      const res = await fetch(`/api/ventures/${venture._id}/clips`);
      if (res.ok) {
        const data = await res.json();
        setClips(data.clips || []);
      }
    } catch {
      console.error('Failed to load clips');
    }
  }, [venture?._id]);

  useEffect(() => {
    if (activeTab === 'videos' && venture?._id) {
      fetchClips();
    }
  }, [activeTab, venture?._id, fetchClips]);

  const handleSaveBasics = async () => {
    if (!venture) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/ventures/${venture._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pitch, problem, who, why, rung }),
      });

      if (res.ok) {
        setVenture({ ...venture, name, pitch, problem, who, why, rung });
      }
    } catch {
      console.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSegment = async () => {
    if (!venture) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/ventures/${venture._id}/segments/${activeSegment}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: segmentBody }),
      });

      if (res.ok) {
        setVenture({
          ...venture,
          segments: {
            ...venture.segments,
            [activeSegment]: { body: segmentBody },
          },
        });
      }
    } catch {
      console.error('Failed to save segment');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-ink-2">Loading...</div>
      </main>
    );
  }

  if (!venture) {
    return null;
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="bg-page border-b border-rule px-6 py-4">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-ink-2 hover:text-ink">
              ← Dashboard
            </Link>
            <span className="text-rule-2">|</span>
            <h1 className="font-semibold">{venture.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/v/${venture.slug}`}
              className="text-[13px] text-ink-2 hover:text-ink"
            >
              Preview
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-soft rounded-lg p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('basics')}
            className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
              activeTab === 'basics'
                ? 'bg-page shadow-sm text-ink'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Basics
          </button>
          <button
            onClick={() => setActiveTab('segment')}
            className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
              activeTab === 'segment'
                ? 'bg-page shadow-sm text-ink'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Segments
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
              activeTab === 'videos'
                ? 'bg-page shadow-sm text-ink'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Videos
          </button>
        </div>

        {activeTab === 'basics' && (
          <div className="bg-page border border-rule rounded-xl p-6 max-w-[600px]">
            <h2 className="text-[20px] font-bold mb-6">Basic info</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium mb-2">
                  Venture name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-2">
                  One-line pitch
                </label>
                <input
                  type="text"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-2">
                  Current stage
                </label>
                <select
                  value={rung}
                  onChange={(e) => setRung(e.target.value as Rung)}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                >
                  {RUNGS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-2">
                  The problem you&apos;re solving
                </label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-2">
                  Who it&apos;s for
                </label>
                <textarea
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-2">
                  Why you&apos;re building this
                </label>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBasics}
              disabled={saving}
              className="mt-6 bg-ink text-white font-semibold px-6 py-2.5 rounded-full text-[14px] hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

        {activeTab === 'segment' && (
          <div className="flex gap-6">
            {/* Segment list */}
            <div className="w-[200px] shrink-0">
              <div className="bg-page border border-rule rounded-xl p-3 space-y-1">
                {SEGMENT_KEYS.map((key) => {
                  const hasContent = venture.segments?.[key]?.body;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSegment(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        activeSegment === key
                          ? 'bg-ink text-white'
                          : hasContent
                          ? 'text-go-deep hover:bg-go-tint'
                          : 'text-ink-2 hover:bg-soft'
                      }`}
                    >
                      {SEGMENT_LABELS[key]}
                      {hasContent && activeSegment !== key && ' ✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Segment editor */}
            <div className="flex-1 bg-page border border-rule rounded-xl p-6">
              <h2 className="text-[20px] font-bold mb-2">
                {SEGMENT_LABELS[activeSegment]}
              </h2>
              <p className="text-ink-2 text-[14px] mb-6">
                {SEGMENT_PROMPTS[activeSegment]}
              </p>

              <textarea
                value={segmentBody}
                onChange={(e) => setSegmentBody(e.target.value)}
                rows={12}
                placeholder="Write your story here..."
                className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none"
              />

              <div className="flex items-center justify-between mt-6">
                <span className="text-[12px] text-ink-3">
                  {segmentBody.length} characters
                </span>
                <button
                  onClick={handleSaveSegment}
                  disabled={saving}
                  className="bg-go text-[#00301E] font-semibold px-6 py-2.5 rounded-full text-[14px] hover:bg-[#04B76B] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save segment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="flex gap-6">
            {/* Question list */}
            <div className="w-[220px] shrink-0">
              <div className="bg-page border border-rule rounded-xl p-3 space-y-1">
                {QUESTIONS.map((q) => {
                  const hasClip = clips.some((c) => c.questionSlug === q.slug);
                  return (
                    <button
                      key={q.slug}
                      onClick={() => setSelectedQuestion(q.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                        selectedQuestion === q.slug
                          ? 'bg-ink text-white'
                          : hasClip
                          ? 'text-go-deep hover:bg-go-tint'
                          : 'text-ink-2 hover:bg-soft'
                      }`}
                    >
                      {q.q.length > 35 ? q.q.slice(0, 35) + '...' : q.q}
                      {hasClip && selectedQuestion !== q.slug && ' ✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video upload/display */}
            <div className="flex-1 bg-page border border-rule rounded-xl p-6">
              {(() => {
                const question = QUESTIONS.find((q) => q.slug === selectedQuestion);
                const existingClip = clips.find((c) => c.questionSlug === selectedQuestion);

                return (
                  <>
                    <h2 className="text-[20px] font-bold mb-2">
                      {question?.q}
                    </h2>
                    <p className="text-ink-2 text-[14px] mb-6">
                      Record a short video (under 60 seconds) answering this question.
                    </p>

                    {existingClip ? (
                      <div className="space-y-4">
                        <VideoPlayer
                          playbackId={existingClip.playbackId}
                          title={existingClip.title}
                        />
                        <div className="flex items-center justify-between">
                          <div className="text-[13px] text-ink-2">
                            {Math.floor(existingClip.durationSec / 60)}:{String(existingClip.durationSec % 60).padStart(2, '0')} ·
                            {existingClip.transcriptStatus === 'ready' && ' Transcript ready'}
                            {existingClip.transcriptStatus === 'pending' && ' Transcribing...'}
                            {existingClip.transcriptStatus === 'failed' && ' Transcript failed'}
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this video?')) return;
                                try {
                                  const res = await fetch(`/api/clips/${existingClip._id}`, {
                                    method: 'DELETE',
                                  });
                                  if (res.ok) {
                                    fetchClips();
                                  }
                                } catch {
                                  console.error('Failed to delete');
                                }
                              }}
                              className="text-[13px] text-dead hover:text-[#8a2a1f]"
                            >
                              Delete
                            </button>
                            {existingClip.publishedAt ? (
                              <span className="text-[13px] text-go-deep">Published</span>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/clips/${existingClip._id}/publish`, {
                                      method: 'POST',
                                    });
                                    if (res.ok) {
                                      fetchClips();
                                    }
                                  } catch {
                                    console.error('Failed to publish');
                                  }
                                }}
                                className="text-[13px] text-go-deep hover:text-go font-medium"
                              >
                                Publish
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <VideoUploader
                        questionSlug={selectedQuestion}
                        onUploadComplete={() => {
                          // Refresh clips after a short delay to let webhook process
                          setTimeout(() => fetchClips(), 3000);
                        }}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
