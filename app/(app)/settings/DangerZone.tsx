'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DangerZone() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion
    setIsDeleting(true);
    // Would call API to delete account
    await new Promise((r) => setTimeout(r, 1000));
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Session */}
      <div className="bg-page border border-rule rounded-xl p-6 mb-6">
        <h3 className="text-[16px] font-bold mb-4">Session</h3>
        <button
          onClick={handleSignOut}
          className="text-[14px] font-semibold text-dead hover:underline"
        >
          Sign out of all devices
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-dead-tint border border-dead/30 rounded-xl p-6">
        <h3 className="text-[16px] font-bold text-dead mb-2">Danger Zone</h3>
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
                disabled={isDeleting}
                className="px-4 py-2 border border-rule rounded-lg text-[13px] font-medium hover:bg-soft disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-dead text-white rounded-lg text-[13px] font-medium hover:bg-dead/90 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
