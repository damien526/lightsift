import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CullApp } from '@/components/CullApp';
import { LANDING_PAGES, landingBySlug } from '@/lib/content';
import { jsonLdGraph, landingGraph } from '@/lib/jsonld';
import { SITE_NAME, SITE_TAGLINE, canonicalUrl, ogImageUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LANDING_PAGES.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = landingBySlug(slug);
  if (!page) return {};
  const url = canonicalUrl(`/${page.slug}`);

  return {
    title: { absolute: page.title },
    description: page.metaDescription,
    alternates: { canonical: url },
    /**
     * ⚠ `images` IS NOT OPTIONAL HERE. Declaring an `openGraph` object in
     * `generateMetadata` REPLACES the layout's, and the file-based
     * `app/opengraph-image.tsx` is not resolved for this segment either — so
     * these twelve pages shipped `twitter:card="summary_large_image"` with no
     * image at all, and every share of them rendered as a bare link. Verified
     * in the built HTML before the fix: zero `og:image` on all twelve.
     */
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      locale: 'en_US',
      title: page.title,
      description: page.metaDescription,
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
      title: page.title,
      description: page.metaDescription,
      images: [ogImageUrl()],
    },
  };
}

export default async function SeoPage({ params }: Props) {
  const { slug } = await params;
  const page = landingBySlug(slug);
  if (!page) notFound();

  const others = LANDING_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <main className="min-h-dvh bg-ink text-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdGraph(landingGraph(page)) }}
      />
      <div className="mx-auto max-w-3xl px-5 py-8">
        <nav className="mb-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber" />
            <span className="font-display text-xl">OnlineCull</span>
          </Link>
          <Link href="/" className="text-sm text-dim transition-colors hover:text-paper">
            Open the app
          </Link>
        </nav>

        <article>
          <h1 className="font-display text-4xl leading-[1.08] sm:text-5xl">{page.h1}</h1>
          <div className="mt-6 space-y-4">
            {page.intro.map((p, i) => (
              <p key={i} className="leading-relaxed text-dim">
                {p}
              </p>
            ))}
          </div>

          <div className="my-10">
            <CullApp embedded />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl">How it works</h2>
          <ol className="mt-5 space-y-5">
            {page.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-sm text-amber">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-dim">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 className="mt-12 font-display text-2xl sm:text-3xl">FAQ</h2>
          <dl className="mt-5 space-y-6">
            {page.faq.map((f) => (
              <div key={f.q}>
                <dt className="mb-1 font-semibold">{f.q}</dt>
                <dd className="text-sm leading-relaxed text-dim">{f.a}</dd>
              </div>
            ))}
          </dl>
        </article>

        <footer className="mt-16 border-t border-line pt-8">
          <h2 className="mb-3 text-sm font-semibold text-dim">More from OnlineCull</h2>
          <nav className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            {others.map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}/`}
                className="text-faint transition-colors hover:text-paper"
              >
                {p.h1}
              </Link>
            ))}
          </nav>
          <p className="mt-8 text-xs text-faint">
            OnlineCull is free and runs entirely in your browser; photos never leave your device.{' '}
            <Link href="/privacy/" className="underline decoration-line underline-offset-2">
              Privacy
            </Link>
            {' · '}
            <Link href="/legal/" className="underline decoration-line underline-offset-2">
              Legal notice
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
