'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DiscoverLink() {
  const pathname = usePathname();
  const isActive = pathname === '/discover';

  return (
    <Link
      href="/discover"
      className={`text-[15px] font-bold px-4 py-2 rounded-full hidden sm:block transition-colors ${
        isActive ? 'text-ink bg-soft' : 'text-ink hover:bg-soft'
      }`}
    >
      Discover
    </Link>
  );
}
