import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[420px] text-center">
        {/* Icon */}
        <div className="text-[60px] mb-6">✉️</div>

        <h1
          className="text-[32px] font-black tracking-tight leading-tight mb-3"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Check your email
        </h1>
        <p className="text-ink-2 text-[15px] mb-8">
          We sent you a magic link. Click it to sign in — no password required.
        </p>

        <div className="bg-soft border border-rule rounded-xl p-5 text-left text-[14px] text-ink-2 space-y-2">
          <p><strong className="text-ink">Not seeing it?</strong></p>
          <ul className="list-disc list-inside space-y-1 text-[13.5px]">
            <li>Check your spam folder</li>
            <li>Make sure you entered the right email</li>
            <li>Links expire after 24 hours</li>
          </ul>
        </div>

        <Link
          href="/login"
          className="inline-block mt-8 text-[14px] text-ink-2 hover:text-ink transition-colors"
        >
          ← Try a different email
        </Link>
      </div>
    </main>
  );
}
