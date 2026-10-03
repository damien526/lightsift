import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans, Spline_Sans_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  ogImageUrl,
} from '@/lib/site';
import './globals.css';

// No `axes` here, deliberately. Asking for `opsz`, `SOFT` and `WONK` takes the
// latin slice of Fraunces from 35 KB to 118 KB, and nothing in the stylesheet
// reads them back — there is no `font-variation-settings` anywhere in the
// project. That was 83 KB per page for three axes the site never used.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
});

const splineMono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-spline-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: './' },
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: ogImageUrl(),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME}: ${SITE_TAGLINE}`,
        type: 'image/png',
      },
    ],
  },
  twitter: { card: 'summary_large_image', images: [ogImageUrl()] },
  /**
   * By default Google truncates the snippet it shows and allows only a small
   * thumbnail. The last two directives lift both limits: the snippet can carry
   * a whole answer, and the social card can show large.
   *
   * `noindex` still sits where it belongs — the 404 declares it for itself and
   * overrides these values (see `app/not-found.tsx`).
   */
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  /**
   * Search Console verification. The token arrives through the environment
   * rather than the repo: it isn't code, and Google can rotate it without a
   * commit. Absent, Next writes nothing — no empty tag ships to production.
   */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0b09',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${splineMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
