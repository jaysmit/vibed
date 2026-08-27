import Link from 'next/link';
import { AuthActions } from './AuthActions';

export function Header() {
  return (
    <header className="border-b border-rule bg-page sticky top-0 z-30">
      <div className="max-w-[1180px] mx-auto px-6 flex items-center gap-4 h-[68px]">
        {/* Logo */}
        <Link
          href="/"
          className="font-display font-black text-[23px] tracking-tight flex items-center gap-[9px]"
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

        {/* Search */}
        <div className="flex-1 max-w-[330px] relative">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 opacity-45">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search ventures, founders, questions"
            className="w-full bg-bg border border-rule rounded-full py-[9px] pl-9 pr-[14px] text-[14px] focus:outline-none focus:border-ink focus:bg-page"
          />
        </div>

        {/* Actions */}
        <div className="ml-auto">
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
