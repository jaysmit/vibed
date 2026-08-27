'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Show dev login in dev mode, or if ?bypass=secret is in URL for production testing
const isDev = process.env.NODE_ENV !== 'production';
const BYPASS_SECRET = 'vibed-test-2026';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bypassMode = searchParams.get('bypass') === BYPASS_SECRET;
  const showDevLogin = isDev || bypassMode;
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // redirect: false so we can handle errors
      const result = await signIn('resend', {
        email,
        callbackUrl: '/following',
        redirect: false,
      });

      if (result?.error) {
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
      } else if (result?.ok) {
        // Redirect to check email page
        window.location.href = '/login/check-email';
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (!email) {
      setError('Enter an email address');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret: bypassMode ? BYPASS_SECRET : undefined }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px]">
      {/* Logo */}
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
        Sign in
      </h2>
      <p className="text-ink-2 text-[15px] mb-8">
        Enter your email to receive a magic link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[13px] font-medium mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
          />
        </div>

        {error && (
          <p className="text-dead text-[13px]">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full bg-ink text-white font-semibold py-3 px-6 rounded-full hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Sending link...' : 'Continue with email'}
        </button>
      </form>

      <p className="text-ink-3 text-[13px] mt-8 text-center">
        No password needed. We&apos;ll email you a link to sign in.
      </p>

      {showDevLogin && (
        <div className="mt-8 pt-6 border-t border-rule">
          <p className="text-[12px] text-ink-3 mb-3 text-center uppercase tracking-wide">
            {bypassMode ? 'Test Mode' : 'Dev Mode'}
          </p>
          <button
            onClick={handleDevLogin}
            disabled={isLoading || !email}
            className="w-full bg-heat text-white font-semibold py-3 px-6 rounded-full hover:bg-[#4a26a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Quick Login (skip email)'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Suspense fallback={<div className="text-ink-2">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
