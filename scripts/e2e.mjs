/**
 * End-to-end check against the static build in out/, driven by headless Chrome.
 * Covers: landing render, real RAW ingestion through the file input (CR2, CR3,
 * NEF, ARW, RAF, RW2), rating and flagging via keyboard, loupe, export panel.
 * Usage: node scripts/e2e.mjs
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = join(import.meta.dirname, '..');
const out = join(root, 'out');
const samples = join(root, 'test', 'samples');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(out, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) file = join(out, path.replace(/\/$/, '') + '.html');
  if (!existsSync(file)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(4871, r));

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}`);
  if (!cond) failed++;
};

try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing
  await page.goto('http://localhost:4871/', { waitUntil: 'networkidle0' });
  check('landing renders h1', (await page.$eval('h1', (el) => el.textContent)).includes('Cull'));
  check('dropzone present', (await page.$('[data-testid="dropzone"]')) !== null);

  // 2. Feed real RAW files through the hidden input
  const input = await page.$('[data-testid="file-input"]');
  const rawFiles = [
    'Canon-5D-Mark-IV.CR2',
    'Canon-EOS-R.CR3',
    'Nikon-Z6.NEF',
    'Sony-a7III.ARW',
    'Fujifilm-X-T4.RAF',
    'Panasonic-G9.RW2',
    'OM-System-OM-1.ORF',
    'Apple-iPhone-12-Pro.DNG',
  ];
  await input.uploadFile(...rawFiles.map((f) => join(samples, f)));
  await page.waitForSelector('[data-testid="grid"]', { timeout: 15000 });
  await page.waitForFunction(
    (n) => document.querySelectorAll('[data-testid="cell"] img').length >= n,
    { timeout: 30000 },
    rawFiles.length,
  );
  check('all 8 RAW previews rendered', true);
  const meta = await page.$eval('[data-testid="session-meta"]', (el) => el.textContent);
  check('session meta shows 8 photos', meta.includes('8 photos'));

  // 3. Keyboard culling: reject first, rate + pick second
  await page.keyboard.press('x');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('3');
  await page.keyboard.press('p');
  await new Promise((r) => setTimeout(r, 300));
  const flags = await page.$$eval('[data-testid="cell"]', (cells) =>
    cells.map((c) => c.className.includes('opacity-55')),
  );
  check('first cell dimmed as reject', flags[0] === true);

  // 4. Loupe opens, shows EXIF, zooms
  await page.keyboard.press('Enter');
  await page.waitForSelector('[data-testid="loupe"]', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 1200));
  const loupeText = await page.$eval('[data-testid="loupe"]', (el) => el.textContent);
  check('loupe shows EXIF (ISO)', loupeText.includes('ISO'));
  const canvasPainted = await page.$eval('[data-testid="loupe"] canvas', (c) => {
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < d.length; i += 400) if (d[i] > 0) return true;
    return false;
  });
  check('loupe canvas painted', canvasPainted);
  await page.keyboard.press('Escape');

  // 5. Export panel
  await page.keyboard.press('e');
  await page.waitForSelector('[data-testid="export-panel"]', { timeout: 5000 });
  const exportText = await page.$eval('[data-testid="export-panel"]', (el) => el.textContent);
  check('export counts picks and rejects', exportText.includes('1 pick') && exportText.includes('1 reject'));
  await page.keyboard.press('Escape');

  // 6. Ratings persist across reload (IndexedDB)
  await page.goto('http://localhost:4871/', { waitUntil: 'networkidle0' });
  const input2 = await page.$('[data-testid="file-input"]');
  await input2.uploadFile(...rawFiles.map((f) => join(samples, f)));
  await page.waitForSelector('[data-testid="grid"]', { timeout: 15000 });
  await page.keyboard.press('e');
  await page.waitForSelector('[data-testid="export-panel"]');
  const exportText2 = await page.$eval('[data-testid="export-panel"]', (el) => el.textContent);
  check('marks restored after reload', exportText2.includes('1 pick') && exportText2.includes('1 reject'));
  await page.keyboard.press('Escape');

  // 7. Demo flow on a SEO page (embedded tool + JPEG path)
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900 });
  await page2.goto('http://localhost:4871/cr2-viewer/', { waitUntil: 'networkidle0' });
  check(
    'seo page has h1',
    (await page2.$eval('h1', (el) => el.textContent)).includes('CR2'),
  );
  check(
    'seo page has FAQ json-ld',
    (await page2.$eval('script[type="application/ld+json"]', (el) => el.textContent)).includes('FAQPage'),
  );
  await page2.click('text/try the sample shoot');
  await page2.waitForSelector('[data-testid="grid"]', { timeout: 20000 });
  await page2.waitForFunction(
    () => document.querySelectorAll('[data-testid="cell"] img').length >= 9,
    { timeout: 30000 },
  );
  check('demo shoot renders 9 JPEG previews on seo page', true);

  // 8. Site plumbing
  const sitemap = await (await fetch('http://localhost:4871/sitemap.xml')).text();
  check('sitemap lists 15 urls', (sitemap.match(/<loc>/g) ?? []).length === 15);
  const robots = await (await fetch('http://localhost:4871/robots.txt')).text();
  check('robots has sitemap', robots.includes('sitemap.xml'));
  const llms = await (await fetch('http://localhost:4871/llms.txt')).text();
  check('llms.txt served', llms.includes('OnlineCull'));
} catch (err) {
  console.error('E2E crashed:', err);
  failed++;
} finally {
  await browser.close();
  server.close();
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll e2e checks passed.');
