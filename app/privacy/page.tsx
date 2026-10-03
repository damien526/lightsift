import type { Metadata } from 'next';
import Link from 'next/link';
import { contentPageGraph, jsonLdGraph } from '@/lib/jsonld';
import { SITE_NAME, canonicalUrl, ogImageUrl } from '@/lib/site';

const DESCRIPTION =
  'OnlineCull processes your photos entirely in your browser. Nothing is uploaded. Here is exactly what the site does and does not collect.';

export const metadata: Metadata = {
  title: 'Privacy',
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl('/privacy') },
  // Declared so the `app/opengraph-image.tsx` file convention cannot override
  // the layout's `images` with the robots-blocked `/opengraph-image` URL.
  // `scripts/og-png.mjs` fails the build if it ever does.
  openGraph: {
    type: 'website',
    url: canonicalUrl('/privacy'),
    siteName: SITE_NAME,
    locale: 'en_US',
    title: 'Privacy · OnlineCull',
    description: DESCRIPTION,
    images: [
      { url: ogImageUrl(), width: 1200, height: 630, alt: SITE_NAME, type: 'image/png' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy · OnlineCull',
    description: DESCRIPTION,
    images: [ogImageUrl()],
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-ink text-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            contentPageGraph({
              url: canonicalUrl('/privacy'),
              name: 'Privacy',
              description: DESCRIPTION,
              crumb: 'Privacy',
            }),
          ),
        }}
      />
      <div className="mx-auto max-w-2xl px-5 py-10">
        <nav className="mb-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber" />
            <span className="font-display text-xl">OnlineCull</span>
          </Link>
        </nav>
        <h1 className="font-display text-4xl">Privacy</h1>
        <div className="mt-6 space-y-5 leading-relaxed text-dim">
          <p>
            <strong className="text-paper">Your photos never leave your device.</strong> OnlineCull
            opens, parses and previews your files entirely inside your browser. There is no upload
            endpoint; the site could not receive your photos even if it wanted to. You can verify
            this in your browser&apos;s network inspector: no image data is ever transmitted.
          </p>
          <p>
            <strong className="text-paper">Ratings stay on your device too.</strong> Stars and flags
            are stored in your browser&apos;s local database (IndexedDB) so a reopened folder
            remembers your work. Clearing site data removes them.
          </p>
          <p>
            <strong className="text-paper">What is collected:</strong> anonymous page analytics
            (Vercel Analytics: page views, country, device type). No cookies for tracking, no ads,
            no fingerprinting, no account system.
          </p>
          <p>
            <strong className="text-paper">File system access:</strong> when you open a folder,
            the browser grants OnlineCull read access to it for the session, and asks you separately
            if you choose an export that writes XMP sidecars or copies picks. OnlineCull never
            modifies or deletes your original image files.
          </p>
          <p>
            <strong className="text-paper">Cookies and consent (GDPR / ePrivacy):</strong> the site
            sets no advertising or tracking cookies and uses no fingerprinting, which is why there
            is no cookie banner. The only data stored on your device (your ratings and flags, in
            IndexedDB) exists purely to provide the feature you asked for and never leaves your
            browser. Vercel Analytics is cookieless and aggregates page views without building
            individual profiles.
          </p>
          <p>
            <strong className="text-paper">Data controller and contact:</strong> Damien Yvert. For
            any privacy question or request, write to{' '}
            <a
              href="mailto:damienyvert.dev@gmail.com"
              className="underline decoration-line underline-offset-2 hover:text-paper"
            >
              damienyvert.dev@gmail.com
            </a>
            . Since no personal data reaches the publisher, most GDPR requests resolve to actions on
            your own device (clearing site data removes everything).
          </p>
          <p className="text-sm text-faint">
            See also the{' '}
            <Link href="/legal/" className="underline decoration-line underline-offset-2 hover:text-paper">
              legal notice
            </Link>{' '}
            (publisher and hosting information).
          </p>
        </div>
      </div>
    </main>
  );
}
