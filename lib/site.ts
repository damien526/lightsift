/** Single source of truth for the site's identity. Update SITE_URL when a custom domain lands. */
export const SITE_URL = 'https://www.onlinecull.com';
export const SITE_NAME = 'OnlineCull';
export const SITE_TAGLINE = 'Cull thousands of photos in your browser';

/**
 * The meta description for the home page.
 *
 * Kept under 160 characters on purpose: Google truncates around there, and the
 * previous 232-character version buried the RAW format list — the detail that
 * actually earns the click — past the cut. The full format list still lives in
 * the page copy and in the `SoftwareApplication` feature list, where length
 * costs nothing.
 */
export const SITE_DESCRIPTION =
  'Free in-browser RAW viewer and photo culler. Open CR2, CR3, NEF, ARW, RAF or DNG folders, rate by keyboard, export XMP for Lightroom. No upload.';

/**
 * Who operates the site.
 *
 * These values already appear in the copy: /legal names the publisher and
 * carries the contact address, as the law requires. The structured data reads
 * them from here so the two can't drift — and so the `sameAs` below points at
 * a profile that exists rather than at a plausible-looking URL.
 */
export const PUBLISHER_NAME = 'Damien Yvert';

export const PUBLISHER_EMAIL = 'damienyvert.dev@gmail.com';

/** The operator's only public profile, and so the graph's only `sameAs`. */
export const PUBLISHER_LINKEDIN = 'https://www.linkedin.com/in/damien-yvert/';

/**
 * When the content last actually changed.
 *
 * This — not the build clock — is what the sitemap's `lastmod` and the
 * markup's `dateModified` carry. A clock date claims every page changed on
 * every push, including the pushes that didn't touch a line of copy, and a
 * sitemap that cries wolf ends up with its `lastmod` ignored. Then the day a
 * page really does change, the signal no longer carries.
 *
 * ⚠ Advance this by hand, and only when copy or `lib/content.ts` changes. A
 * styling tweak, a build fix or a component rename leave it alone.
 */
export const CONTENT_REVIEWED_ON = '2026-10-03';

/** Absolute URL for an internal path. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Canonical form of an internal URL. `trailingSlash: true` is on. */
export function canonicalUrl(path = '/'): string {
  const url = absoluteUrl(path);
  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * URL of a page's social card.
 *
 * POURQUOI THIS INDIRECTION — Next writes its social image WITHOUT an
 * extension: `out/opengraph-image`. Served as-is by a static host it comes
 * back as `application/octet-stream`, and the Facebook, X, LinkedIn and Slack
 * crawlers then refuse the preview. `trailingSlash: true` adds a second risk,
 * a redirect from `/opengraph-image` to `/opengraph-image/`.
 *
 * `scripts/og-png.mjs` therefore copies it to `out/og/home.png` after the
 * build: an ordinary address, with an extension, that every social crawler
 * accepts. This is the address the pages declare, and it is why `robots.ts`
 * can close `/opengraph-image` without taking the previews down with it.
 */
export function ogImageUrl(): string {
  return absoluteUrl('/og/home.png');
}
