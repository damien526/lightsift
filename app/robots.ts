import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Answer engines and their training crawlers, named one by one.
 *
 * This changes nothing about what they are allowed to do — the wildcard
 * already permitted it. Writing them out makes the decision legible: a free
 * tool that wants to be cited correctly by an assistant has every interest in
 * being read by one, and silence reads as oversight rather than as a choice.
 * A crawler that reads only its own group sees the same exclusions as the
 * others, hence the repetition below.
 */
const ANSWER_ENGINES = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
];

/**
 * The only addresses not to crawl — two build artefacts, nothing more. There
 * is no account, no private area and no server route on this site.
 *
 * `index.txt` : Next drops one next to every `index.html`, carrying the React
 * payload for the same content. Served as plain text and indexable, it would
 * make every page exist twice, once in serialisation jargon. Verified present
 * in `out/` for all fifteen pages before this rule.
 *
 * `opengraph-image` : Next writes its PNG there without an extension, and a
 * static host serves it as `application/octet-stream`. It is not the address
 * the pages declare — they point at `/og/home.png`, copied by
 * `scripts/og-png.mjs` — but it answers all the same.
 *
 * ⚠ THE ORDER OF THOSE TWO FACTS MATTERS. Social crawlers
 * (`facebookexternalhit`, `Twitterbot`, `LinkedInBot`, `Slackbot`) respect
 * robots.txt. Closing `/opengraph-image` is only safe BECAUSE no `og:image`
 * tag points there any more. Whoever puts that address back in a tag must drop
 * the `Disallow` with it, or the previews go down site-wide.
 */
const DISALLOW = [
  '/index.txt',
  '/*/index.txt',
  '/opengraph-image',
  '/*/opengraph-image',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...ANSWER_ENGINES.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOW,
      })),
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
