/**
 * Submits every sitemap URL to IndexNow (Bing, Seznam, Naver, Yandex…).
 * Run manually after a deployment: `npm run indexnow`.
 *
 * The key file must be served at /<key>.txt : it lives in public/.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEY = readFileSync(join(root, 'public', 'indexnow-key.txt'), 'utf8').trim();

const sitemap = readFileSync(join(root, 'out', 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error('No URLs found : run `npm run build` first.');

const host = new URL(urls[0]).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: `https://${host}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} : ${urls.length} URLs submitted for ${host}`);
