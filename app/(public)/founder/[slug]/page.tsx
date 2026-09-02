import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { Avatar, ProgressRing } from '@/components/ui';
import { calculateCompletion } from '@/lib/domain/standards';
import { TEAM_ROLE_LABELS, type TeamRole, type Venture } from '@/lib/supabase/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FounderProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createAdminClient();
  const currentUserId = await getCurrentUserId();

  // Get founder by slug
  const { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!founder) {
    notFound();
  }

  // Check if this is the current user's profile
  const isOwner = currentUserId && founder.user_id === currentUserId;

  // Get ventures where founder is the creator
  const { data: ownVentures } = await supabase
    .from('ventures')
    .select('*')
    .eq('founder_id', founder.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Try to get team memberships (may not exist yet)
  let teamMemberships: { venture_id: string; role: TeamRole; venture?: Venture }[] = [];
  try {
    const { data: memberships } = await supabase
      .from('venture_members')
      .select('venture_id, role')
      .eq('founder_id', founder.id)
      .eq('status', 'accepted');

    if (memberships && memberships.length > 0) {
      // Get the ventures for these memberships
      const ventureIds = memberships.map(m => m.venture_id);
      const { data: memberVentures } = await supabase
        .from('ventures')
        .select('*')
        .in('id', ventureIds)
        .is('deleted_at', null);

      teamMemberships = memberships.map(m => ({
        ...m,
        venture: memberVentures?.find(v => v.id === m.venture_id),
      }));
    }
  } catch {
    // Table doesn't exist yet, ignore
  }

  // Combine ventures: own ventures + team memberships
  const allVentures: (Venture & { role: string; isOwner: boolean })[] = [
    ...(ownVentures || []).map(v => ({ ...v, role: 'founder', isOwner: true })),
    ...teamMemberships
      .filter(m => m.venture && !ownVentures?.some(v => v.id === m.venture_id))
      .map(m => ({ ...m.venture!, role: m.role, isOwner: false })),
  ];

  // Filter: only show published ventures to non-owners
  const visibleVentures = isOwner
    ? allVentures
    : allVentures.filter(v => v.status === 'live' || v.status === 'graduated');

  // Stats
  const activeCount = allVentures.filter(v => v.status === 'live' || v.status === 'draft').length;
  const exitedCount = allVentures.filter(v => v.status === 'graduated').length;

  return (
    <main className="max-w-[900px] mx-auto px-6 py-10">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <Avatar
          name={founder.name}
          imageUrl={founder.links?.avatar}
          size="2xl"
          color="#1F6F5C"
        />

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-[32px] font-black tracking-tight"
                style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
              >
                {founder.name}
              </h1>
              {founder.headline && (
                <p className="text-ink-2 text-[16px] mt-1">{founder.headline}</p>
              )}
              {founder.location && (
                <p className="text-ink-3 text-[14px] mt-2 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {founder.location}
                </p>
              )}
            </div>

            {isOwner && (
              <Link
                href="/profile"
                className="text-[13px] text-ink-2 hover:text-ink px-3 py-1.5 border border-rule rounded-lg hover:bg-soft transition-colors"
              >
                Edit profile
              </Link>
            )}
          </div>

          {/* Social links */}
          {founder.links && Object.keys(founder.links).length > 0 && (
            <div className="flex gap-3 mt-4">
              {founder.links.linkedin && (
                <a
                  href={founder.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-3 hover:text-ink transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {founder.links.twitter && (
                <a
                  href={founder.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-3 hover:text-ink transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {founder.links.website && (
                <a
                  href={founder.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-3 hover:text-ink transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {founder.bio && (
        <div className="mb-8">
          <p className="text-[15px] text-ink-2 leading-relaxed">{founder.bio}</p>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex gap-8 py-4 border-y border-rule mb-8">
        <div>
          <div className="text-[28px] font-bold font-mono">{allVentures.length}</div>
          <div className="text-[12px] text-ink-3 uppercase tracking-wide">Ventures</div>
        </div>
        <div>
          <div className="text-[28px] font-bold font-mono">{activeCount}</div>
          <div className="text-[12px] text-ink-3 uppercase tracking-wide">Active</div>
        </div>
        {exitedCount > 0 && (
          <div>
            <div className="text-[28px] font-bold font-mono text-go">{exitedCount}</div>
            <div className="text-[12px] text-ink-3 uppercase tracking-wide">Exited</div>
          </div>
        )}
        <div>
          <div className="text-[28px] font-bold font-mono">
            {new Date(founder.created_at).getFullYear()}
          </div>
          <div className="text-[12px] text-ink-3 uppercase tracking-wide">Joined</div>
        </div>
      </div>

      {/* Ventures Section */}
      <div>
        <h2
          className="text-[22px] font-bold tracking-tight mb-6"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Ventures
        </h2>

        {visibleVentures.length === 0 ? (
          <div className="text-center py-12 bg-soft rounded-xl">
            <p className="text-ink-3">
              {isOwner ? "You haven't created any ventures yet." : "No ventures to show."}
            </p>
            {isOwner && (
              <Link
                href="/start"
                className="inline-block mt-4 bg-go text-[#00301E] font-semibold px-6 py-2 rounded-full hover:bg-[#04B76B] transition-colors"
              >
                Start a venture
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleVentures.map((venture) => {
              const completion = calculateCompletion(venture);
              const showProgress = isOwner && venture.isOwner;

              return (
                <Link
                  key={venture.id}
                  href={`/v/${venture.slug}`}
                  className="block bg-page border border-rule rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Venture glyph/logo */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: venture.brand || '#F4F4F1' }}
                    >
                      {venture.glyph || '🚀'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[18px] font-bold truncate">{venture.name}</h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          venture.role === 'founder' ? 'bg-go-tint text-go-deep' :
                          venture.role === 'partner' ? 'bg-heat-tint text-heat' :
                          'bg-soft text-ink-2'
                        }`}>
                          {TEAM_ROLE_LABELS[venture.role as TeamRole] || venture.role}
                        </span>
                        {venture.status === 'draft' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-warn-tint text-warn">
                            Draft
                          </span>
                        )}
                        {venture.status === 'graduated' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-go-tint text-go-deep">
                            Exited
                          </span>
                        )}
                        {venture.status === 'closed' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-dead-tint text-dead">
                            Closed
                          </span>
                        )}
                      </div>
                      {venture.pitch && (
                        <p className="text-[14px] text-ink-2 mt-1 line-clamp-2">{venture.pitch}</p>
                      )}
                    </div>

                    {/* Progress ring for owner */}
                    {showProgress && (
                      <div className="flex-shrink-0">
                        <ProgressRing percentage={completion.percentage} size={44} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
