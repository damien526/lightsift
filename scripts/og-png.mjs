/**
 * Copy the Open Graph image to an address that has an extension, then PROVE
 * that every built page points at it.
 *
 *   node scripts/og-png.mjs      (run automatically after `next build`)
 *
 * ---------------------------------------------------------------------------
 * PART ONE — why the copy exists
 * ---------------------------------------------------------------------------
 *
 * Next writes its social image WITHOUT an extension: `out/opengraph-image`.
 * Three problems follow, from a single cause — a path that does not look like
 * a file:
 *
 *   1. a static host serves it as `application/octet-stream`, and the
 *      Facebook, X, LinkedIn and Slack crawlers then refuse the preview;
 *   2. `trailingSlash: true` threatens to add a redirect to it;
 *   3. `app/robots.ts` closes `/opengraph-image` to keep it out of the page
 *      index — and because social crawlers respect robots.txt, that rule takes
 *      the site's own share cards down with it.
 *
 * So it is copied to `out/og/home.png`, the address the pages declare (see
 * `ogImageUrl` in `lib/site.ts`) and the one the `Disallow` does not cover.
 *
 * ---------------------------------------------------------------------------
 * PART TWO — why the check exists, and why it is not optional
 * ---------------------------------------------------------------------------
 *
 * Declaring the right URL in `lib/site.ts` is not enough, because Next has a
 * second, SILENT source for `og:image`: the `app/opengraph-image.tsx` file
 * convention. On any page that does not declare an `openGraph` block of its
 * own, THE FILE CONVENTION WINS over the `images` inherited from the layout —
 * and that page ships the extensionless, robots-blocked URL again.
 *
 * That is exactly how the original bug hid. The first fix declared `images` in
 * the layout and on the landing pages, and a check for "does every page have
 * an og:image?" passed — while the home page, /privacy, /terms and the 404
 * were all still pointing at the blocked address. Presence was never the
 * question; the address was.
 *
 * So the invariant is checked here, over the built HTML, and the build fails
 * if it does not hold: every `og:image` and `twitter:image` must live under
 * `/og/`, and the file it names must exist. Add a page and forget its
 * `openGraph.images`, and you find out at build time instead of the first time
 * someone shares the link.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'out';
const DEST = join(OUT, 'og');
const SOURCE = join(OUT, 'opengraph-image');

if (!existsSync(OUT)) {
  console.error(`${OUT}/ is missing: run \`next build\` first.`);
  process.exit(1);
}

if (!existsSync(SOURCE)) {
  console.error(
    `${SOURCE} not found. Every page declares /og/home.png as its og:image, ` +
      'so social previews would 404: build stopped.',
  );
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });
copyFileSync(SOURCE, join(DEST, 'home.png'));
console.log(`Open Graph image copied to ${DEST}/home.png`);

/* -------------------------------------------------------------------------- */
/*                      The invariant, checked over the HTML                   */
/* -------------------------------------------------------------------------- */

function htmlFiles(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_next') continue;
      htmlFiles(full, found);
    } else if (entry.name.endsWith('.html')) {
      found.push(full);
    }
  }
  return found;
}

/** Every social image URL a page declares, Open Graph and Twitter alike. */
function socialImages(html) {
  const urls = [];
  for (const re of [
    /<meta property="og:image" content="([^"]*)"/g,
    /<meta name="twitter:image" content="([^"]*)"/g,
  ]) {
    for (const match of html.matchAll(re)) urls.push(match[1]);
  }
  return urls;
}

const problems = [];

for (const file of htmlFiles(OUT)) {
  const page = file.slice(OUT.length) || '/';
  const html = readFileSync(file, 'utf8');
  const images = socialImages(html);

  if (images.length === 0) {
    problems.push(`${page} declares no og:image at all`);
    continue;
  }

  for (const url of images) {
    let pathname;
    try {
      pathname = new URL(url).pathname;
    } catch {
      problems.push(`${page} declares a social image that is not an absolute URL: ${url}`);
      continue;
    }

    if (!pathname.startsWith('/og/')) {
      problems.push(
        `${page} points at ${pathname}, which robots.txt blocks. ` +
          'Declare `openGraph.images` (and `twitter.images`) on this page: ' +
          'without them the app/opengraph-image.tsx file convention wins.',
      );
      continue;
    }

    if (!existsSync(join(OUT, pathname))) {
      problems.push(`${page} points at ${pathname}, which does not exist in ${OUT}/`);
    }
  }
}

if (problems.length > 0) {
  console.error('\nSocial card check failed:\n');
  for (const problem of problems) console.error(`  · ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(`Social cards verified on ${htmlFiles(OUT).length} pages: all under /og/.`);
