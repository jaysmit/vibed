'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');
      setLoading(false);
    };
    loadUser();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main className="max-w-[700px] mx-auto px-6 py-10">
        <div className="text-ink-3">Loading...</div>
      </main>
    );
  }

  return (
    <main className="max-w-[700px] mx-auto px-6 py-10">
      <h1
        className="text-[32px] font-black tracking-tight mb-8"
        style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
      >
        Settings
      </h1>

      {/* Account section */}
      <section className="bg-page border border-rule rounded-xl p-6 mb-6">
        <h2 className="text-[18px] font-bold mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink-3 mb-1">Email</label>
            <div className="text-[15px] font-medium">{email}</div>
          </div>
          <div className="pt-2">
            <Link
              href="/profile"
              className="text-[14px] text-go-deep hover:underline"
            >
              Edit profile →
            </Link>
          </div>
        </div>
      </section>

      {/* Notifications section */}
      <section className="bg-page border border-rule rounded-xl p-6 mb-6">
        <h2 className="text-[18px] font-bold mb-4">Notifications</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-[14px] font-medium">Email updates</div>
              <div className="text-[13px] text-ink-3">Get notified about ventures you follow</div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded border-rule text-go focus:ring-go"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-[14px] font-medium">Weekly digest</div>
              <div className="text-[13px] text-ink-3">Summary of activity from ventures you follow</div>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded border-rule text-go focus:ring-go"
            />
          </label>
        </div>
      </section>

      {/* Session section */}
      <section className="bg-page border border-rule rounded-xl p-6 mb-6">
        <h2 className="text-[18px] font-bold mb-4">Session</h2>
        <button
          onClick={handleSignOut}
          className="text-[14px] font-semibold text-dead hover:underline"
        >
          Sign out of all devices
        </button>
      </section>

      {/* Danger zone */}
      <section className="bg-dead-tint border border-dead/30 rounded-xl p-6">
        <h2 className="text-[18px] font-bold text-dead mb-2">Danger Zone</h2>
        <p className="text-[14px] text-ink-2 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[14px] font-semibold text-dead hover:underline"
          >
            Delete my account
          </button>
        ) : (
          <div className="bg-page border border-dead rounded-lg p-4">
            <p className="text-[14px] font-medium mb-3">
              Are you sure? This will permanently delete your account and all your ventures.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-rule rounded-lg text-[13px] font-medium hover:bg-soft"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-dead text-white rounded-lg text-[13px] font-medium hover:bg-dead/90"
              >
                Yes, delete my account
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
