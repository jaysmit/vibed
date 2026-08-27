import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { Header, VentureCard } from '@/components/ui';
import { getVenturesByIds } from '@/lib/services/ventures-public';
import { getFollowedVentureIds } from '@/lib/services';

export default async function FollowingPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const followedIds = await getFollowedVentureIds(userId);
  const ventures = await getVenturesByIds(followedIds);

  return (
    <>
      <Header />

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        <h1
          className="text-[32px] font-black tracking-tight mb-2"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Following
        </h1>
        <p className="text-ink-2 text-[15px] mb-8">
          Ventures you&apos;re keeping an eye on.
        </p>

        {ventures.length > 0 ? (
          <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
            {ventures.map((venture) => (
              <VentureCard
                key={venture._id}
                slug={venture.slug}
                name={venture.name}
                pitch={venture.pitch}
                brand={venture.brand}
                glyph={venture.glyph}
                rung={venture.rung}
                status={venture.status}
                founder={venture.founder}
                promise={venture.promise}
                promiseHistory={venture.promiseHistory}
                counters={venture.counters}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="text-[60px] opacity-20 mb-4">👀</div>
            <h2 className="text-[28px] font-extrabold font-display">Nothing here yet</h2>
            <p className="text-ink-2 mt-2 text-[15.5px]">
              Follow some ventures to see them here.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-[#2a2a2a] transition-colors"
            >
              Browse ventures
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
