import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/ui';
import { ProfileEditor } from './ProfileEditor';
import { AccountSettings } from './AccountSettings';

export default async function ProfilePage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const supabase = await createAdminClient();

  // Get founder profile
  const { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get user email
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);

  if (!founder) {
    redirect('/register');
  }

  // Get ventures count
  const { count: venturesCount } = await supabase
    .from('ventures')
    .select('*', { count: 'exact', head: true })
    .eq('founder_id', founder.id)
    .is('deleted_at', null);

  return (
    <main className="max-w-[700px] mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-[32px] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Your Profile
        </h1>
        <Link
          href={`/founder/${founder.slug}`}
          className="text-[13px] text-go-deep hover:underline flex items-center gap-1"
        >
          View public profile
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Link>
      </div>

      {/* Profile card */}
      <div className="bg-page border border-rule rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <Avatar name={founder.name} size="lg" color="#1F6F5C" />
          <div className="flex-1">
            <h2 className="text-[24px] font-bold">{founder.name}</h2>
            {founder.headline && (
              <p className="text-ink-2 text-[14px] mt-0.5">{founder.headline}</p>
            )}
            <p className="text-ink-3 text-[13px] mt-1">@{founder.slug}</p>
            {founder.location && (
              <p className="text-ink-2 text-[14px] mt-1 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {founder.location}
              </p>
            )}
          </div>
        </div>

        {founder.bio && (
          <p className="text-[15px] text-ink-2 mt-4 leading-relaxed">{founder.bio}</p>
        )}

        <div className="flex gap-6 mt-6 pt-4 border-t border-rule">
          <div>
            <div className="text-[24px] font-bold font-mono">{venturesCount || 0}</div>
            <div className="text-[12px] text-ink-3 uppercase tracking-wide">Ventures</div>
          </div>
          <div>
            <div className="text-[24px] font-bold font-mono">
              {new Date(founder.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
            </div>
            <div className="text-[12px] text-ink-3 uppercase tracking-wide">Joined</div>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <ProfileEditor
        founderId={founder.id}
        initialName={founder.name}
        initialHeadline={founder.headline || ''}
        initialBio={founder.bio || ''}
        initialLocation={founder.location || ''}
        initialLinks={{
          linkedin: founder.links?.linkedin,
          twitter: founder.links?.twitter,
          website: founder.links?.website,
        }}
      />

      {/* Account settings */}
      <div className="mt-6">
        <AccountSettings email={user?.email || ''} />
      </div>
    </main>
  );
}
