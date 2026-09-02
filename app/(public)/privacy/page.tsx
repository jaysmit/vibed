import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Vibed',
  description: 'How we handle your data',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-[700px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/" className="text-[13px] text-ink-3 hover:text-ink transition-colors">
        ← Back to home
      </Link>

      <h1
        className="text-[28px] sm:text-[36px] font-black tracking-tight mt-6 mb-8"
        style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
      >
        Privacy Policy
      </h1>

      <div className="prose prose-sm max-w-none text-ink-2">
        <p className="text-[15px] leading-relaxed mb-6">
          <strong>Last updated:</strong> September 2026
        </p>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">What we collect</h2>
          <p className="text-[14px] leading-relaxed mb-4">
            When you create an account, we collect your email address and any profile information
            you choose to provide (name, location, bio). When you document your venture, we store
            the content you create including text, images, and video.
          </p>
          <p className="text-[14px] leading-relaxed">
            We use cookies and similar technologies to keep you logged in and understand how
            people use Vibed. This includes page views, clicks, and video engagement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">How we use it</h2>
          <ul className="text-[14px] leading-relaxed space-y-2 list-disc pl-5">
            <li>To provide and improve the service</li>
            <li>To send you updates about your venture and followers (you can opt out)</li>
            <li>To calculate trending content and recommendations</li>
            <li>To prevent abuse and enforce our terms</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">What we share</h2>
          <p className="text-[14px] leading-relaxed mb-4">
            We do not sell your personal data. We may share data with:
          </p>
          <ul className="text-[14px] leading-relaxed space-y-2 list-disc pl-5">
            <li>Service providers who help us run Vibed (hosting, email, video processing)</li>
            <li>Law enforcement if legally required</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Your rights</h2>
          <p className="text-[14px] leading-relaxed">
            You can access, update, or delete your account at any time. If you have questions
            about your data, contact us at privacy@vibed.app.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-[18px] font-bold text-ink mb-3">Video content</h2>
          <p className="text-[14px] leading-relaxed">
            Videos are processed through Mux for playback and transcription. By uploading
            video, you agree to Mux&apos;s processing of that content.
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-bold text-ink mb-3">Changes</h2>
          <p className="text-[14px] leading-relaxed">
            We may update this policy. Material changes will be notified via email or
            prominent notice on the site.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-rule">
        <Link href="/terms" className="text-[13px] text-go-deep hover:underline">
          Read our Terms of Service →
        </Link>
      </div>
    </main>
  );
}
