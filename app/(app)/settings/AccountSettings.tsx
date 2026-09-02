'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AccountSettingsProps {
  email: string;
  founderSlug: string;
}

export function AccountSettings({ email, founderSlug }: AccountSettingsProps) {
  const router = useRouter();
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || newEmail === email) {
      setIsEditingEmail(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      setSuccess('Check your new email for a confirmation link.');
      setIsEditingEmail(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setSuccess('Password updated successfully!');
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setIsEditingEmail(false);
    setIsEditingPassword(false);
    setNewEmail(email);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="bg-page border border-rule rounded-xl p-6">
      <h3 className="text-[16px] font-bold mb-4">Account Settings</h3>

      {error && (
        <div className="mb-4 p-3 bg-dead-tint text-dead text-[13px] rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-go-tint text-go-deep text-[13px] rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-[13px] font-medium text-ink-3 mb-2">Email address</label>
          {isEditingEmail ? (
            <div className="space-y-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-[13px] font-medium border border-rule rounded-lg hover:bg-soft transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEmail}
                  disabled={isLoading}
                  className="px-4 py-2 text-[13px] font-medium bg-go text-[#00301E] rounded-lg hover:bg-[#04B76B] transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save email'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[15px]">{email}</span>
              <button
                onClick={() => setIsEditingEmail(true)}
                className="text-[13px] text-go-deep hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="pt-4 border-t border-rule">
          <label className="block text-[13px] font-medium text-ink-3 mb-2">Password</label>
          {isEditingPassword ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-ink-3 mb-1">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[12px] text-ink-3 mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-4 py-3 rounded-xl border border-rule bg-page text-[15px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-[13px] font-medium border border-rule rounded-lg hover:bg-soft transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePassword}
                  disabled={isLoading}
                  className="px-4 py-2 text-[13px] font-medium bg-go text-[#00301E] rounded-lg hover:bg-[#04B76B] transition-colors"
                >
                  {isLoading ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[15px]">••••••••</span>
              <button
                onClick={() => setIsEditingPassword(true)}
                className="text-[13px] text-go-deep hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Profile URL */}
        <div className="pt-4 border-t border-rule">
          <label className="block text-[13px] font-medium text-ink-3 mb-2">Profile URL</label>
          <div className="text-[15px] text-ink-2">
            vibed.app/founder/<span className="text-ink font-medium">{founderSlug}</span>
          </div>
          <p className="text-[12px] text-ink-3 mt-1">
            Contact support to change your profile URL
          </p>
        </div>
      </div>
    </div>
  );
}
