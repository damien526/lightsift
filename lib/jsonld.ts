/**
 * Structured data for the site.
 *
 * ⚠ THE RULE THIS FILE EXISTS FOR — JSON-LD is read one page at a time. An
 * `@id` declared elsewhere does not exist: a page that writes
 * `publisher: { '@id': '…/#org' }` without declaring the `#org` node in the
 * same document produces a dangling reference, which engines drop in silence.
 * The `#website` / `#org` / `#person` base is therefore REPEATED ON EVERY
 * PAGE — that is what `siteGraph()` is for. Never "factor it out" to one page.
 *
 * What this replaced: the home page carried an anonymous `SoftwareApplication`
 * plus an `FAQPage`, and the twelve landing pages carried an `FAQPage` and
 * nothing else. Nothing tied the pages of the site into a single entity, and
 * nothing told an engine that the thing being described on /cr2-viewer is the
 * same application as the one on /nef-viewer.
 *
 * `@id` NAMING CONVENTION:
 *   · global entities → fragment on the root     `/#website`, `/#org`, `/#person`
 *   · per-page nodes  → fragment on the page URL `/cr2-viewer/#page`
 */
import type { LandingPage } from './content';
import {
  CONTENT_REVIEWED_ON,
  PUBLISHER_EMAIL,
  PUBLISHER_LINKEDIN,
  PUBLISHER_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  canonicalUrl,
  ogImageUrl,
} from './site';

export const WEBSITE_ID = canonicalUrl('/') + '#website';
export const ORG_ID = canonicalUrl('/') + '#org';
export const PERSON_ID = canonicalUrl('/') + '#person';
/** One application, one identifier, whichever page describes it. */
export const APP_ID = canonicalUrl('/') + '#app';

/** The page that names the publisher, as the law requires it to. */
const PUBLISHER_PAGE = canonicalUrl('/legal');

type Node = Record<string, unknown>;

const ref = (id: string) => ({ '@id': id });

const breadcrumbId = (url: string) => `${url}#breadcrumb`;

/**
 * The site, its publisher, and the person behind it. Three identical nodes on
 * every page: this is what lets an engine resolve the brand as one stable
 * entity rather than as a pile of unrelated pages.
 *
 * `sameAs` is declared on `Person` only, and carries one address: the
 * operator's LinkedIn profile, which exists. `Organization` has none — the
 * site has no company page, and a personal profile is not one. An invented
 * `sameAs` points at nothing and damages the entity instead of strengthening it.
 */
export function siteGraph(): Node[] {
  return [
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: canonicalUrl('/'),
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: ref(ORG_ID),
    },
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      url: canonicalUrl('/'),
      email: PUBLISHER_EMAIL,
      // Reciprocal of `Person.worksFor` below: both directions are declared,
      // or the link only holds one way.
      founder: ref(PERSON_ID),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icon-512.png'),
        width: 512,
        height: 512,
      },
    },
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: PUBLISHER_NAME,
      // /legal is the page that names the publisher: the only verifiable
      // address for this entity on the site.
      url: PUBLISHER_PAGE,
      email: PUBLISHER_EMAIL,
      sameAs: [PUBLISHER_LINKEDIN],
      worksFor: ref(ORG_ID),
    },
  ];
}

/**
 * What the tool does, for an engine. The list is capabilities that are real
 * and checkable in the app; it is not a sales pitch.
 */
const FEATURE_LIST = [
  'Open folders of RAW photos locally, no upload',
  'CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2, PEF, JPEG support',
  'Keyboard-first rating, picks and rejects',
  '1:1 loupe with EXIF and histogram',
  'XMP sidecar export for Lightroom, Bridge and Capture One',
  'Copy keepers into a selects folder',
];

/** The application itself — ONE node for the whole site, with a stable `@id`. */
export function softwareApplication(): Node {
  return {
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: SITE_NAME,
    url: canonicalUrl('/'),
    description: SITE_DESCRIPTION,
    screenshot: ogImageUrl(),
    image: ogImageUrl(),
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript and the File System Access API',
    inLanguage: 'en',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: FEATURE_LIST,
    isPartOf: ref(WEBSITE_ID),
    publisher: ref(ORG_ID),
    author: ref(PERSON_ID),
  };
}

/**
 * The document itself — one node per page, and only one.
 *
 * The type stays `WebPage` even on pages that carry an FAQ. The two nodes are
 * deliberately separate: `FAQPage` is the markup Google stopped displaying in
 * 2023 and may stop reading, `WebPage` carries the durable signals. Housing
 * them together would make the second depend on the first.
 */
export function webPage({
  url,
  name,
  description,
  mainEntity,
  hasBreadcrumb,
}: {
  url: string;
  name: string;
  description: string;
  mainEntity?: string;
  hasBreadcrumb?: boolean;
}): Node {
  return {
    '@type': 'WebPage',
    '@id': `${url}#page`,
    url,
    name,
    description,
    inLanguage: 'en',
    dateModified: CONTENT_REVIEWED_ON,
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: ogImageUrl(),
      width: 1200,
      height: 630,
    },
    isPartOf: ref(WEBSITE_ID),
    ...(mainEntity ? { mainEntity: ref(mainEntity) } : {}),
    ...(hasBreadcrumb ? { breadcrumb: ref(breadcrumbId(url)) } : {}),
    publisher: ref(ORG_ID),
  };
}

/**
 * The visible FAQ, word for word.
 *
 * The text must match what the reader sees exactly — that is the validity
 * condition Google sets, and the reason the FAQ is a plain `<dl>` rather than
 * an accordion.
 */
export function faqPage(url: string, items: readonly { q: string; a: string }[]): Node {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    inLanguage: 'en',
    isPartOf: ref(WEBSITE_ID),
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function howTo(
  url: string,
  name: string,
  steps: readonly { title: string; body: string }[],
): Node {
  return {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name,
    inLanguage: 'en',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.body,
    })),
  };
}

export function breadcrumb(url: string, trail: { name: string; url: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId(url),
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: step.url,
    })),
  };
}

export const HOME_CRUMB = { name: SITE_NAME, url: canonicalUrl('/') };

/* -------------------------------------------------------------------------- */
/*                          One graph per page shape                          */
/* -------------------------------------------------------------------------- */

/** Home: the base, the document, the application. No breadcrumb at the root. */
export function homeGraph(faq: readonly (readonly [string, string])[]): Node[] {
  const url = canonicalUrl('/');
  return [
    ...siteGraph(),
    webPage({ url, name: SITE_NAME, description: SITE_DESCRIPTION, mainEntity: APP_ID }),
    softwareApplication(),
    faqPage(
      url,
      faq.map(([q, a]) => ({ q, a })),
    ),
  ];
}

/** A landing page: document, FAQ, how-to, breadcrumb, and the base. */
export function landingGraph(page: LandingPage): Node[] {
  const url = canonicalUrl(`/${page.slug}`);
  return [
    ...siteGraph(),
    webPage({
      url,
      name: page.h1,
      description: page.metaDescription,
      mainEntity: APP_ID,
      hasBreadcrumb: true,
    }),
    softwareApplication(),
    faqPage(url, page.faq),
    howTo(url, page.h1, page.steps),
    breadcrumb(url, [HOME_CRUMB, { name: page.h1, url }]),
  ];
}

/** An ordinary page outside the catalogue — privacy and the legal notice. */
export function contentPageGraph({
  url,
  name,
  description,
  crumb,
}: {
  url: string;
  name: string;
  description: string;
  crumb: string;
}): Node[] {
  return [
    ...siteGraph(),
    webPage({ url, name, description, hasBreadcrumb: true }),
    breadcrumb(url, [HOME_CRUMB, { name: crumb, url }]),
  ];
}

/**
 * Wraps a page's nodes in a single `@graph` and returns the string to drop
 * into the `<script>`. One `@context`, one block: nodes can cite each other by
 * `@id` with nothing dangling.
 */
export function jsonLdGraph(nodes: Node[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(
    /</g,
    '\\u003c',
  );
}
