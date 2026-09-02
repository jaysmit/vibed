'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function AuthActions() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path;

  if (loading) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[14px] text-ink-3 px-3 py-2">...</span>
      </div>
    );
  }

  if (user) {
    return (
      <>
        {/* Desktop nav */}
        <div className="flex items-center gap-1">
          {/* Center nav item */}
          <Link
            href="/discover"
            className={`text-[14px] font-medium px-3 py-2 rounded-full hidden sm:flex items-center gap-[7px] transition-colors ${
              isActive('/discover') ? 'text-ink bg-soft' : 'text-ink-2 hover:text-ink hover:bg-soft'
            }`}
          >
            Discover
          </Link>

          {/* Profile link */}
          <Link
            href="/profile"
            className={`text-[14px] font-medium px-3 py-2 rounded-full hidden sm:flex items-center gap-[7px] transition-colors ${
              isActive('/profile') ? 'text-ink bg-soft' : 'text-ink-2 hover:text-ink hover:bg-soft'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </Link>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-[14px] font-medium text-ink-2 px-3 py-2 rounded-full hover:text-ink hover:bg-soft"
            >
              <span
                className="w-7 h-7 rounded-full bg-ink text-white grid place-items-center text-[11px] font-semibold"
              >
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </span>
              <svg
                className={`w-4 h-4 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-page border border-rule rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-rule">
                  <div className="text-[12px] text-ink-3 truncate">{user.email}</div>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-2 hover:bg-soft hover:text-ink"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-2 hover:bg-soft hover:text-ink"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/following"
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-2 hover:bg-soft hover:text-ink"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Following
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-2 hover:bg-soft hover:text-ink"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-2 hover:bg-soft hover:text-ink"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Help
                </Link>
                <div className="border-t border-rule mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-dead hover:bg-dead-tint w-full text-left"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/start"
            className="bg-go text-[#00301E] font-semibold px-[15px] py-2 rounded-full text-[14px] hover:bg-[#04B76B] transition-colors hidden sm:block"
          >
            Start your venture
          </Link>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav pathname={pathname} />
      </>
    );
  }

  // Logged out state
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/discover"
        className={`text-[14px] font-medium px-3 py-2 rounded-full hidden sm:flex items-center gap-[7px] transition-colors ${
          isActive('/discover') ? 'text-ink bg-soft' : 'text-ink-2 hover:text-ink hover:bg-soft'
        }`}
      >
        Discover
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
        Start your venture
      </Link>
    </div>
  );
}

// Mobile bottom navigation (always visible on mobile when logged in)
function MobileBottomNav({ pathname }: { pathname: string }) {
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-page border-t border-rule sm:hidden z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            isActive('/') ? 'text-go' : 'text-ink-3'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/discover"
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            isActive('/discover') ? 'text-go' : 'text-ink-3'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="text-[10px] font-medium">Discover</span>
        </Link>

        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            isActive('/dashboard') ? 'text-go' : 'text-ink-3'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            isActive('/profile') ? 'text-go' : 'text-ink-3'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
