import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, canonicalUrl, ogImageUrl } from '@/lib/site';

/**
 * The canonical is pinned to the home page rather than left to the layout's
 * `canonical: './'`.
 *
 * A relative canonical resolves against the internal `_not-found` segment,
 * which produced `https://www.onlinecull.com/_not-found/` — an address that
 * returns 404. Verified in the built `out/404.html` before the fix. The page
 * is `noindex`, so the damage was bounded, but a canonical pointing at a page
 * that does not exist is a false statement either way.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
  alternates: { canonical: canonicalUrl('/') },
  // Declared for the same reason as every other page: without an `openGraph`
  // block the `app/opengraph-image.tsx` file convention wins and ships the
  // robots-blocked `/opengraph-image` URL. `scripts/og-png.mjs` enforces it.
  openGraph: {
    type: 'website',
    url: canonicalUrl('/'),
    siteName: SITE_NAME,
    locale: 'en_US',
    images: [
      { url: ogImageUrl(), width: 1200, height: 630, alt: SITE_NAME, type: 'image/png' },
    ],
  },
  twitter: { card: 'summary_large_image', images: [ogImageUrl()] },
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-5 text-center text-paper">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber">404</p>
      <h1 className="mt-3 font-display text-4xl">This frame is missing</h1>
      <p className="mt-3 text-dim">The page you were looking for does not exist.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-amber-bright"
      >
        Back to OnlineCull
      </Link>
    </main>
  );
}
