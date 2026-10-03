/**
 * Submits every sitemap URL to IndexNow (Bing, Seznam, Naver, Yandex…).
 * Run manually after a deployment: `npm run indexnow`.
 *
 * The sitemap is read from the deployed site, not from `out/`. A local build
 * can be ahead of production or behind it, and either way we would be naming
 * URLs a crawler will not find. Reading what the site actually serves also
 * removes the trap of running this after forgetting to build.
 *
 * The origin comes from lib/site.ts, the same line the app itself uses, so this
 * script cannot fall behind a domain change.
 *
 * The key file must be served at /<key>.txt : it lives in public/.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEY = readFileSync(join(root, 'public', 'indexnow-key.txt'), 'utf8').trim();

const site = readFileSync(join(root, 'lib', 'site.ts'), 'utf8');
const SITE = site.match(/https:\/\/[^"'\s]+/)?.[0];
if (!SITE) throw new Error('No SITE_URL found in lib/site.ts');

const sitemap = await fetch(`${SITE}/sitemap.xml`);
if (!sitemap.ok) throw new Error(`${SITE}/sitemap.xml answered ${sitemap.status}. Is the site deployed?`);
const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error('The sitemap served no URLs.');

const host = new URL(urls[0]).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: `https://${host}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} : ${urls.length} URLs submitted for ${host}`);
if (!res.ok) console.log(await res.text());
