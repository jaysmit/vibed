'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VentureLogo } from '@/components/ui';
import { TEAM_ROLE_LABELS, type TeamRole } from '@/lib/supabase/types';

interface Invitation {
  id: string;
  name: string;
  email: string | null;
  role: TeamRole;
  venture: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    glyph: string;
  };
  invitedBy: string | null;
  createdAt: string;
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Check auth
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email || '' });
      }

      // Fetch invitation
      const res = await fetch(`/api/invitations/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invitation not found');
      } else {
        setInvitation(data.invitation);
      }

      setLoading(false);
    };
    loadData();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      // Redirect to venture page
      router.push(`/v/${data.ventureSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      await fetch(`/api/invitations/${token}`, {
        method: 'DELETE',
      });
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-ink-2">Loading...</div>
      </main>
    );
  }

  if (error && !invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-[48px] mb-4">😕</div>
          <h1
            className="text-[24px] font-black tracking-tight mb-2"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            {error === 'Invitation already used' ? 'Invitation Used' : 'Invitation Not Found'}
          </h1>
          <p className="text-ink-2 mb-6">
            {error === 'Invitation already used'
              ? 'This invitation has already been accepted or declined.'
              : 'This invitation link is invalid or has expired.'}
          </p>
          <Link
            href="/"
            className="inline-block bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-go-deep transition-colors"
          >
            Go home
          </Link>
        </div>
      </main>
    );
  }

  if (!invitation) return null;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <h1
            className="text-[28px] font-black tracking-tight mb-2"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            You&apos;re invited!
          </h1>
          <p className="text-ink-2">
            {invitation.invitedBy || 'Someone'} has invited you to join their venture.
          </p>
        </div>

        {/* Venture card */}
        <div className="bg-page border border-rule rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <VentureLogo
              glyph={invitation.venture.glyph}
              brand={invitation.venture.brand}
              size="lg"
            />
            <div>
              <h2 className="text-[20px] font-bold">{invitation.venture.name}</h2>
              <p className="text-[14px] text-ink-3">
                as {TEAM_ROLE_LABELS[invitation.role]}
              </p>
            </div>
          </div>

          {invitation.name && (
            <p className="text-[14px] text-ink-2">
              Invited as: <span className="font-medium">{invitation.name}</span>
            </p>
          )}
        </div>

        {/* Auth state */}
        {!user ? (
          <div className="bg-warn-tint border border-warn/30 rounded-xl p-4 mb-6">
            <p className="text-[14px] text-warn font-medium mb-2">
              You need to sign in to accept this invitation.
            </p>
            <p className="text-[13px] text-ink-2">
              Don&apos;t have an account?{' '}
              <Link href={`/register?redirect=/invite/${token}`} className="text-warn hover:underline">
                Create one
              </Link>{' '}
              first.
            </p>
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="inline-block mt-3 bg-warn text-white font-semibold px-5 py-2 rounded-full text-[14px] hover:bg-warn/90 transition-colors"
            >
              Sign in to continue
            </Link>
          </div>
        ) : (
          <div className="bg-soft rounded-xl p-4 mb-6 text-[14px]">
            <p className="text-ink-2">
              Signed in as <span className="font-medium text-ink">{user.email}</span>
            </p>
          </div>
        )}

        {error && (
          <p className="text-dead text-[13px] mb-4 text-center">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-3 px-6 border border-rule rounded-full text-[14px] font-semibold hover:bg-soft transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={!user || accepting}
            className="flex-1 py-3 px-6 bg-go text-[#00301E] rounded-full text-[14px] font-semibold hover:bg-[#04B76B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept invitation'}
          </button>
        </div>
      </div>
    </main>
  );
}
