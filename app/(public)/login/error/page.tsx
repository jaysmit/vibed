import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[420px] text-center">
        {/* Icon */}
        <div className="text-[60px] mb-6">😕</div>

        <h1
          className="text-[32px] font-black tracking-tight leading-tight mb-3"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Something went wrong
        </h1>
        <p className="text-ink-2 text-[15px] mb-8">
          We couldn&apos;t sign you in. The link may have expired or already been used.
        </p>

        <Link
          href="/login"
          className="inline-block bg-ink text-white font-semibold py-3 px-6 rounded-full hover:bg-[#2a2a2a] transition-colors"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
