import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Vibed',
  description: 'Terms and conditions for using Vibed',
};

export default function TermsPage() {
  return (
    <main className="max-w-[700px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/" className="text-[13px] text-ink-3 hover:text-ink transition-colors">
        ← Back to home
      </Link>

      <h1
        className="text-[28px] sm:text-[36px] font-black tracking-tight mt-6 mb-8"
        style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
      >
        Terms of Service
      </h1>

      <div className="prose prose-sm max-w-none text-ink-2">
        <p className="text-[15px] leading-relaxed mb-6">
          <strong>Last updated:</strong> September 2026
        </p>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Using Vibed</h2>
          <p className="text-[14px] leading-relaxed mb-4">
            Vibed is a platform for founders to document their ventures. By using Vibed,
            you agree to these terms.
          </p>
          <p className="text-[14px] leading-relaxed">
            You must be at least 18 years old to create an account. You are responsible for
            maintaining the security of your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Your content</h2>
          <p className="text-[14px] leading-relaxed mb-4">
            You retain ownership of content you create on Vibed. By posting content, you grant
            us a license to display, distribute, and promote it on the platform.
          </p>
          <p className="text-[14px] leading-relaxed">
            You are responsible for ensuring your content does not violate others&apos; rights
            or applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Acceptable use</h2>
          <p className="text-[14px] leading-relaxed mb-4">
            You agree not to:
          </p>
          <ul className="text-[14px] leading-relaxed space-y-2 list-disc pl-5">
            <li>Post false or misleading content</li>
            <li>Harass or abuse other users</li>
            <li>Attempt to gain unauthorized access to the service</li>
            <li>Use the service for illegal purposes</li>
            <li>Scrape or crawl the site without permission</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Promises</h2>
          <p className="text-[14px] leading-relaxed">
            Promises made on Vibed are public commitments to your followers. While we track
            promise history, Vibed is not responsible for the outcome of any promises made.
            This is a tool for accountability, not a contract.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Service availability</h2>
          <p className="text-[14px] leading-relaxed">
            We aim to keep Vibed available, but do not guarantee uninterrupted service.
            We may modify or discontinue features at any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Termination</h2>
          <p className="text-[14px] leading-relaxed">
            We may suspend or terminate accounts that violate these terms. You may delete
            your account at any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Limitation of liability</h2>
          <p className="text-[14px] leading-relaxed">
            Vibed is provided &quot;as is&quot; without warranties. We are not liable for any
            damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink mb-3">Contact</h2>
          <p className="text-[14px] leading-relaxed">
            Questions about these terms? Contact us at legal@vibed.app.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-rule">
        <Link href="/privacy" className="text-[13px] text-go-deep hover:underline">
          Read our Privacy Policy →
        </Link>
      </div>
    </main>
  );
}
