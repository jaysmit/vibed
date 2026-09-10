'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CountrySelector } from '@/components/ui';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Compress image using canvas
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    try {
      const compressed = await compressImage(file, 400, 0.85);
      setAvatar(compressed);
    } catch {
      setError('Failed to process image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name');
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
        // Make error messages more user-friendly
        let errorMessage = signUpError.message;
        if (errorMessage.toLowerCase().includes('user already registered') ||
            errorMessage.toLowerCase().includes('already been registered')) {
          errorMessage = 'This email is already registered. Try signing in instead.';
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Create founder profile
      if (authData.user) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const res = await fetch('/api/founder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            location: country || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to create profile');
          setIsLoading(false);
          return;
        }

        // Update profile with headline and avatar if provided
        if (headline.trim() || avatar) {
          await fetch('/api/founder', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              headline: headline.trim() || undefined,
              links: avatar ? { avatar } : undefined,
            }),
          });
        }
      }

      // Redirect to profile page
      window.location.href = '/profile';
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
          {/* Avatar upload */}
          <div className="flex items-center gap-4 pb-4 border-b border-rule">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-rule"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-soft flex items-center justify-center text-ink-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-go rounded-full flex items-center justify-center cursor-pointer hover:bg-[#04B76B] transition-colors shadow-md">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00301E" strokeWidth="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
            </div>
            <div>
              <p className="text-[14px] font-medium">Profile Photo</p>
              <p className="text-[12px] text-ink-3">Optional • Click the camera to upload</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-[13px] font-medium mb-2">
                First name *
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Maya"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-[13px] font-medium mb-2">
                Last name *
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Okonkwo"
                required
                className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
              />
            </div>
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
            <label htmlFor="headline" className="block text-[13px] font-medium mb-2">
              Your one-liner
            </label>
            <input
              id="headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Former Stripe engineer turned founder"
              className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent transition-shadow"
            />
            <p className="text-[11px] text-ink-3 mt-1">What makes you interesting? Previous role, superpower, or fun fact</p>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-2">
              Country
            </label>
            <CountrySelector
              value={country}
              onChange={setCountry}
              placeholder="Select your country"
            />
          </div>

          {error && (
            <p className="text-dead text-[13px]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password || !firstName || !lastName}
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
