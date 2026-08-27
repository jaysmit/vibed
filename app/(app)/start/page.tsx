'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { INDUSTRIES, INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

type Step = 'founder' | 'venture' | 'submitting';

export default function StartPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [step, setStep] = useState<Step>('founder');
  const [error, setError] = useState('');

  // Founder fields
  const [founderName, setFounderName] = useState('');
  const [founderBio, setFounderBio] = useState('');
  const [founderLocation, setFounderLocation] = useState('');

  // Venture fields
  const [ventureName, setVentureName] = useState('');
  const [venturePitch, setVenturePitch] = useState('');
  const [ventureIndustry, setVentureIndustry] = useState<Industry>('tech');

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleFounderNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setStep('venture');
  };

  const handleVentureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventureName.trim() || !venturePitch.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setStep('submitting');

    try {
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderName,
          founderBio,
          founderLocation,
          ventureName,
          venturePitch,
          ventureIndustry,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create venture');
      }

      const data = await res.json();
      router.push(`/v/${data.ventureSlug}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('venture');
    }
  };

  // Show login prompt if not authenticated
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-ink-2">Loading...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-[420px] text-center">
          <h1
            className="text-[32px] font-black tracking-tight mb-3"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            Tell your story
          </h1>
          <p className="text-ink-2 text-[15px] mb-8">
            Sign in to start documenting your journey.
          </p>
          <Link
            href="/login"
            className="inline-block bg-ink text-white font-semibold py-3 px-8 rounded-full hover:bg-[#2a2a2a] transition-colors"
          >
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <Link href="/" className="block mb-10">
          <h1
            className="text-[28px] font-black tracking-tight"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            vibed
          </h1>
        </Link>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full ${step === 'founder' ? 'bg-ink' : 'bg-go'}`} />
          <div className={`h-1 flex-1 rounded-full ${step === 'venture' || step === 'submitting' ? 'bg-ink' : 'bg-rule'}`} />
        </div>

        {step === 'founder' && (
          <form onSubmit={handleFounderNext}>
            <h2
              className="text-[28px] font-black tracking-tight leading-tight mb-2"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              First, tell us about you
            </h2>
            <p className="text-ink-2 text-[15px] mb-8">
              Who&apos;s behind this venture?
            </p>

            <div className="space-y-5">
              <div>
                <label htmlFor="founderName" className="block text-[13px] font-medium mb-2">
                  Your name *
                </label>
                <input
                  id="founderName"
                  type="text"
                  value={founderName}
                  onChange={(e) => setFounderName(e.target.value)}
                  placeholder="Maya Okonkwo"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="founderLocation" className="block text-[13px] font-medium mb-2">
                  Where are you based?
                </label>
                <input
                  id="founderLocation"
                  type="text"
                  value={founderLocation}
                  onChange={(e) => setFounderLocation(e.target.value)}
                  placeholder="Melbourne"
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="founderBio" className="block text-[13px] font-medium mb-2">
                  One-line bio
                </label>
                <input
                  id="founderBio"
                  type="text"
                  value={founderBio}
                  onChange={(e) => setFounderBio(e.target.value)}
                  placeholder="Freelance producer for nine years. First-time founder."
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>
            </div>

            {error && <p className="text-dead text-[13px] mt-4">{error}</p>}

            <button
              type="submit"
              className="w-full mt-8 bg-ink text-white font-semibold py-3 px-6 rounded-full hover:bg-[#2a2a2a] transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {step === 'venture' && (
          <form onSubmit={handleVentureSubmit}>
            <button
              type="button"
              onClick={() => setStep('founder')}
              className="text-[13px] text-ink-2 hover:text-ink mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <h2
              className="text-[28px] font-black tracking-tight leading-tight mb-2"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              Now, your venture
            </h2>
            <p className="text-ink-2 text-[15px] mb-8">
              What are you building?
            </p>

            <div className="space-y-5">
              <div>
                <label htmlFor="ventureName" className="block text-[13px] font-medium mb-2">
                  Venture name *
                </label>
                <input
                  id="ventureName"
                  type="text"
                  value={ventureName}
                  onChange={(e) => setVentureName(e.target.value)}
                  placeholder="Slate"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="venturePitch" className="block text-[13px] font-medium mb-2">
                  One-line pitch *
                </label>
                <input
                  id="venturePitch"
                  type="text"
                  value={venturePitch}
                  onChange={(e) => setVenturePitch(e.target.value)}
                  placeholder="Turns voice notes into client-ready briefs"
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
                <p className="text-[12px] text-ink-3 mt-2">
                  Keep it short. You can always change this later.
                </p>
              </div>

              <div>
                <label htmlFor="ventureIndustry" className="block text-[13px] font-medium mb-2">
                  Industry *
                </label>
                <select
                  id="ventureIndustry"
                  value={ventureIndustry}
                  onChange={(e) => setVentureIndustry(e.target.value as Industry)}
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {INDUSTRY_LABELS[ind]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-dead text-[13px] mt-4">{error}</p>}

            <button
              type="submit"
              className="w-full mt-8 bg-go text-[#00301E] font-semibold py-3 px-6 rounded-full hover:bg-[#04B76B] transition-colors"
            >
              Create my journey
            </button>
          </form>
        )}

        {step === 'submitting' && (
          <div className="text-center py-12">
            <div className="text-[40px] mb-4">🚀</div>
            <h2
              className="text-[24px] font-black tracking-tight"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              Creating your journey...
            </h2>
          </div>
        )}
      </div>
    </main>
  );
}
