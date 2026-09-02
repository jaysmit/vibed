'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { type Industry, type TeamRole } from '@/lib/supabase/types';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { CategorySelector } from '@/components/ui/CategorySelector';
import { TeamMemberAdd } from '@/components/ui/TeamMemberAdd';

type Step = 'loading' | 'name' | 'team' | 'country' | 'categories' | 'submitting';

interface TeamMember {
  type: 'existing' | 'new';
  founderId?: string;
  founderName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: TeamRole;
}

export default function StartPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const [founderId, setFounderId] = useState<string | null>(null);

  // Form state
  const [ventureName, setVentureName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [country, setCountry] = useState<string | null>(null);
  const [categories, setCategories] = useState<Industry[]>([]);

  // Invitation URLs for display
  const [invitationUrls, setInvitationUrls] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/start');
        return;
      }

      // Check if user has a founder profile
      const res = await fetch('/api/founder');
      const data = await res.json();

      if (!data.founder) {
        // User needs to create founder profile first - redirect to register
        router.push('/register');
        return;
      }

      setFounderId(data.founder.id);
      setStep('name');
    };
    checkAuthAndProfile();
  }, [router]);

  const handleNameNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventureName.trim()) {
      setError('Please enter a venture name');
      return;
    }
    setError('');
    setStep('team');
  };

  const handleTeamNext = () => {
    setError('');
    setStep('country');
  };

  const handleCountryNext = () => {
    setError('');
    setStep('categories');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setError('');
    setStep('submitting');

    try {
      // Create venture
      const res = await fetch('/api/ventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ventureName,
          country,
          categories,
          teamMembers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create venture');
      }

      // Store invitation URLs for display
      if (data.invitationUrls && data.invitationUrls.length > 0) {
        setInvitationUrls(data.invitationUrls);
        // Show invitations before redirecting
        setTimeout(() => {
          router.push(`/v/${data.ventureSlug}`);
        }, 5000);
      } else {
        router.push(`/v/${data.ventureSlug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('categories');
    }
  };

  const goBack = () => {
    if (step === 'team') setStep('name');
    else if (step === 'country') setStep('team');
    else if (step === 'categories') setStep('country');
  };

  const getStepNumber = () => {
    switch (step) {
      case 'name': return 0;
      case 'team': return 1;
      case 'country': return 2;
      case 'categories': return 3;
      default: return 0;
    }
  };

  if (step === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-ink-2">Loading...</div>
      </main>
    );
  }

  if (step === 'submitting' && invitationUrls.length > 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px] text-center">
          <div className="text-[48px] mb-4">🎉</div>
          <h2
            className="text-[28px] font-black tracking-tight mb-4"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            Venture created!
          </h2>
          <p className="text-ink-2 mb-8">
            Share these invitation links with your team members:
          </p>
          <div className="space-y-3 text-left">
            {invitationUrls.map((inv, i) => (
              <div key={i} className="p-4 bg-soft rounded-xl">
                <div className="font-semibold text-[15px] mb-2">{inv.name}</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inv.url}
                    className="flex-1 px-3 py-2 bg-page border border-rule rounded-lg text-[13px] text-ink-2"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(inv.url)}
                    className="px-3 py-2 bg-ink text-white rounded-lg text-[13px] font-medium hover:bg-go-deep transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-ink-3 mt-6">
            Redirecting to your venture editor...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[520px]">
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
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= getStepNumber() ? 'bg-go' : 'bg-rule'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Venture Name */}
        {step === 'name' && (
          <form onSubmit={handleNameNext}>
            <h2
              className="text-[28px] font-black tracking-tight leading-tight mb-2"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              What&apos;s your venture called?
            </h2>
            <p className="text-ink-2 text-[15px] mb-8">
              Pick a name. You can always change it later.
            </p>

            <div>
              <input
                type="text"
                value={ventureName}
                onChange={(e) => setVentureName(e.target.value)}
                placeholder="Slate"
                autoFocus
                className="w-full px-4 py-4 rounded-xl border border-rule bg-page text-[18px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
            </div>

            {error && <p className="text-dead text-[13px] mt-4">{error}</p>}

            <button
              type="submit"
              disabled={!ventureName.trim()}
              className="w-full mt-8 bg-go text-[#00301E] font-semibold py-3 px-6 rounded-full hover:bg-[#04B76B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 1: Team Members */}
        {step === 'team' && (
          <div>
            <button
              type="button"
              onClick={goBack}
              className="text-[13px] text-ink-2 hover:text-ink mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <h2
              className="text-[28px] font-black tracking-tight leading-tight mb-2"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              Add your team
            </h2>
            <p className="text-ink-2 text-[15px] mb-8">
              Working with others? Add them now or skip this step.
            </p>

            <TeamMemberAdd
              members={teamMembers}
              onMembersChange={setTeamMembers}
            />

            {error && <p className="text-dead text-[13px] mt-4">{error}</p>}

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleTeamNext}
                className="flex-1 bg-rule text-ink font-semibold py-3 px-6 rounded-full hover:bg-rule-2 transition-colors"
              >
                {teamMembers.length === 0 ? 'Skip for now' : 'Continue'}
              </button>
              {teamMembers.length > 0 && (
                <button
                  type="button"
                  onClick={handleTeamNext}
                  className="flex-1 bg-go text-[#00301E] font-semibold py-3 px-6 rounded-full hover:bg-[#04B76B] transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Country */}
        {step === 'country' && (
          <div>
            <button
              type="button"
              onClick={goBack}
              className="text-[13px] text-ink-2 hover:text-ink mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <h2
              className="text-[28px] font-black tracking-tight leading-tight mb-2"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              Where are you based?
            </h2>
            <p className="text-ink-2 text-[15px] mb-8">
              Where is your venture operating from?
            </p>

            <CountrySelector
              value={country}
              onChange={setCountry}
              placeholder="Select a country"
            />

            {error && <p className="text-dead text-[13px] mt-4">{error}</p>}

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleCountryNext}
                className={`flex-1 font-semibold py-3 px-6 rounded-full transition-colors ${
                  country
                    ? 'bg-go text-[#00301E] hover:bg-[#04B76B]'
                    : 'bg-rule text-ink hover:bg-rule-2'
                }`}
              >
                {country ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Categories */}
        {step === 'categories' && (
          <form onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={goBack}
              className="text-[13px] text-ink-2 hover:text-ink mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <h2
              className="text-[28px] font-black tracking-tight leading-tight mb-2"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              What category fits best?
            </h2>
            <p className="text-ink-2 text-[15px] mb-8">
              Select up to 3 categories that describe your venture.
            </p>

            <CategorySelector
              value={categories}
              onChange={setCategories}
              maxSelection={3}
            />

            {error && <p className="text-dead text-[13px] mt-4">{error}</p>}

            <button
              type="submit"
              disabled={categories.length === 0}
              className="w-full mt-8 bg-go text-[#00301E] font-semibold py-3 px-6 rounded-full hover:bg-[#04B76B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create venture
            </button>
          </form>
        )}

        {/* Submitting state */}
        {step === 'submitting' && invitationUrls.length === 0 && (
          <div className="text-center py-12">
            <div className="text-[40px] mb-4">🚀</div>
            <h2
              className="text-[24px] font-black tracking-tight"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              Creating your venture...
            </h2>
          </div>
        )}
      </div>
    </main>
  );
}
