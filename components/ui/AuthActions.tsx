'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function AuthActions() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[14px] text-ink-3 px-3 py-2">...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/following"
          className="text-[14px] font-medium text-ink-2 px-3 py-2 rounded-full hover:text-ink hover:bg-soft hidden sm:flex items-center gap-[7px]"
        >
          Following
        </Link>
        <Link
          href="/dashboard"
          className="text-[14px] font-medium text-ink-2 px-3 py-2 rounded-full hover:text-ink hover:bg-soft hidden sm:flex items-center gap-[7px]"
        >
          Dashboard
        </Link>
        <button
          onClick={handleSignOut}
          className="text-[14px] font-medium text-ink-2 px-3 py-2 rounded-full hover:text-ink hover:bg-soft hidden sm:flex items-center gap-[7px]"
        >
          Sign out
        </button>
        <Link
          href="/start"
          className="bg-go text-[#00301E] font-semibold px-[15px] py-2 rounded-full text-[14px] hover:bg-[#04B76B] transition-colors"
        >
          Tell your story
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/following"
        className="text-[14px] font-medium text-ink-2 px-3 py-2 rounded-full hover:text-ink hover:bg-soft hidden sm:flex items-center gap-[7px]"
      >
        Following
      </Link>
      <Link
        href="/login"
        className="text-[14px] font-medium text-ink-2 px-3 py-2 rounded-full hover:text-ink hover:bg-soft hidden sm:flex items-center gap-[7px]"
      >
        Sign in
      </Link>
      <Link
        href="/start"
        className="bg-go text-[#00301E] font-semibold px-[15px] py-2 rounded-full text-[14px] hover:bg-[#04B76B] transition-colors"
      >
        Tell your story
      </Link>
    </div>
  );
}
