/**
 * Submits sitemap URLs to IndexNow (Bing, Seznam, Naver, Yandex…). Google does
 * not read it, which is fine: Search Console already covers that side.
 *
 *     npm run indexnow               # every URL in the sitemap
 *     npm run indexnow -- /blog/     # only the URLs containing that
 *
 * Deliberately NOT wired into `npm run build`. A build runs on every push,
 * including pushes that change no page, and resubmitting unchanged URLs is
 * precisely what the protocol asks you not to do. Run it by hand after a
 * deployment that changed content.
 *
 * Nothing about the site is restated here. The origin comes from lib/site.ts,
 * the URL list from the sitemap production actually serves, the host from
 * those URLs, and the key from the name of the file that is served to prove
 * ownership. There is no second source to keep in sync, so the script cannot
 * drift from the app, from the page list, or from a domain change.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function fail(message) {
  console.error(message);
  process.exit(1);
}

/**
 * The key is a public shared secret: it authorises nothing beyond signalling a
 * change on this domain, and the protocol requires it to be served in clear.
 * It is therefore the NAME of a file in public/, and reading it from there
 * rather than from a constant is what makes it impossible for the key we send
 * and the key we serve to disagree.
 */
const keyFiles = readdirSync(join(root, 'public')).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keyFiles.length !== 1) {
  fail(`Expected exactly one <key>.txt in public/, found ${keyFiles.length}: ${keyFiles.join(', ') || 'none'}`);
}
const KEY = keyFiles[0].replace('.txt', '');

/** Single source of truth for the canonical origin, shared with the app. */
const site = readFileSync(join(root, 'lib', 'site.ts'), 'utf8');
const SITE = site.match(/https:\/\/[^"'\s]+/)?.[0];
if (!SITE) fail('No canonical origin found in lib/site.ts');

/**
 * The deployed sitemap, not a local build. A build can be ahead of production
 * or behind it, and either way we would be naming URLs a crawler will not
 * find. This also removes the trap of running the script after forgetting to
 * build.
 */
let sitemapResponse;
try {
  sitemapResponse = await fetch(`${SITE}/sitemap.xml`);
} catch (error) {
  fail(`Cannot reach ${SITE}/sitemap.xml : ${error.message}`);
}
if (!sitemapResponse.ok) {
  fail(`${SITE}/sitemap.xml answered ${sitemapResponse.status}. Is the site deployed?`);
}

const all = [...(await sitemapResponse.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (all.length === 0) fail('The sitemap served no URLs.');

const filter = process.argv[2];
const urlList = filter ? all.filter((url) => url.includes(filter)) : all;
if (urlList.length === 0) fail(`None of the ${all.length} sitemap URLs contain "${filter}".`);

const { host, origin } = new URL(all[0]);
const keyLocation = `${origin}/${KEY}.txt`;

/**
 * The key file is what authorises the submission. If it is missing or holds
 * something else, the service rejects the whole batch silently and after the
 * fact, so check it before sending anything. This is not hypothetical: a key
 * file that existed under the wrong name made every submission on one of these
 * sites a no-op for days, with a 202 on every run.
 */
let probe;
try {
  probe = await fetch(keyLocation);
} catch (error) {
  fail(`Cannot reach ${keyLocation} : ${error.message}`);
}
if (!probe.ok) fail(`${keyLocation} answered ${probe.status}. The key is not served.`);
const served = (await probe.text()).trim();
if (served !== KEY) {
  fail(`${keyLocation} does not hold the expected key. Served: "${served.slice(0, 40)}".`);
}

const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
});

// 200: accepted. 202: accepted, the key is still being validated.
if (response.status === 200 || response.status === 202) {
  console.log(`IndexNow: ${urlList.length} URL(s) submitted for ${host} (${response.status}).`);
} else {
  fail(`IndexNow answered ${response.status} : ${(await response.text()).slice(0, 200)}`);
}
