import Link from 'next/link';
import { AuthActions } from './AuthActions';
import { SearchBar } from './SearchBar';

export function Header() {
  return (
    <header className="border-b border-rule bg-page sticky top-0 z-30">
      <div className="max-w-[1180px] mx-auto px-6 flex items-center h-[68px]">
        {/* Logo - left aligned */}
        <Link
          href="/"
          className="font-display font-black text-[23px] tracking-tight flex items-center gap-[9px] flex-shrink-0"
          style={{ fontVariationSettings: "'SOFT' 80, 'WONK' 1" }}
        >
          <svg className="h-5" viewBox="0 0 44 32" aria-hidden="true">
            <rect x="0" y="24" width="5" height="8" rx="1.5" className="fill-ink" />
            <rect x="7.8" y="20" width="5" height="12" rx="1.5" className="fill-ink" />
            <rect x="15.6" y="16" width="5" height="16" rx="1.5" className="fill-ink" />
            <rect x="23.4" y="12" width="5" height="20" rx="1.5" className="fill-go" />
            <rect x="31.2" y="6" width="5" height="26" rx="1.5" className="fill-go" />
            <rect x="39" y="0" width="5" height="32" rx="1.5" className="fill-go" />
          </svg>
          vibed
        </Link>

        {/* Center - Search + Discover link */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="max-w-[330px] w-full hidden sm:block">
            <SearchBar />
          </div>
        </div>

        {/* Actions - right aligned */}
        <div className="flex-shrink-0">
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
