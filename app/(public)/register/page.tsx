'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your name');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Create founder profile
      if (authData.user) {
        const res = await fetch('/api/founder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName.trim(),
            location: location.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to create profile');
          setIsLoading(false);
          return;
        }
      }

      // Redirect to dashboard (or check-email if confirmation required)
      window.location.href = '/dashboard';
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="block mb-10">
          <h1
            className="text-[28px] font-black tracking-tight"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            vibed
          </h1>
        </Link>

        <h2
          className="text-[32px] font-black tracking-tight leading-tight mb-2"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Create account
        </h2>
        <p className="text-ink-2 text-[15px] mb-8">
          Start sharing your founder journey.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-[13px] font-medium mb-2">
              Full name *
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Maya Okonkwo"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[13px] font-medium mb-2">
              Email address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-[13px] font-medium mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Melbourne, Australia"
              className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
            />
          </div>

          {error && (
            <p className="text-dead text-[13px]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password || !fullName}
            className="w-full bg-go text-[#00301E] font-semibold py-3 px-6 rounded-full hover:bg-[#04B76B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-ink-2 text-[14px] mt-8 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-ink font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
