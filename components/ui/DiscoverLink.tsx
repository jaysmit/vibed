'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DiscoverLink() {
  const pathname = usePathname();
  const isActive = pathname === '/discover';

  return (
    <Link
      href="/discover"
      className={`text-[18px] font-extrabold px-5 py-2.5 rounded-full hidden sm:block transition-colors ${
        isActive ? 'text-ink bg-soft' : 'text-ink hover:bg-soft'
      }`}
    >
      Discover
    </Link>
  );
}
