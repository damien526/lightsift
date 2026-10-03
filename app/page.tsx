import type { Metadata } from 'next';
import { CullApp } from '@/components/CullApp';
import { HOME_FAQ } from '@/lib/faq';
import { homeGraph, jsonLdGraph } from '@/lib/jsonld';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  canonicalUrl,
  ogImageUrl,
} from '@/lib/site';

/**
 * The home page declares its own `openGraph` block for one reason: without
 * one, the `app/opengraph-image.tsx` file convention overrides the `images`
 * inherited from the layout, and this page shipped the extensionless,
 * robots-blocked `/opengraph-image` URL. `scripts/og-png.mjs` fails the build
 * if that ever comes back.
 */
export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl('/') },
  openGraph: {
    type: 'website',
    url: canonicalUrl('/'),
    siteName: SITE_NAME,
    locale: 'en_US',
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
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
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [ogImageUrl()],
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdGraph(homeGraph(HOME_FAQ)) }}
      />
      <CullApp />
    </>
  );
}
