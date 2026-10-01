import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
const violations = [];
page.on('console', (m) => {
  if (/Content Security Policy|Refused to/.test(m.text())) violations.push(m.text());
});
page.on('pageerror', (e) => violations.push('pageerror: ' + e.message));
await page.setViewport({ width: 1440, height: 900 });
await page.goto('https://lightsift.vercel.app/', { waitUntil: 'networkidle0' });
await page.click('[data-testid="open-demo"]');
await page.waitForSelector('[data-testid="grid"]', { timeout: 30000 });
await page.waitForFunction(
  () => document.querySelectorAll('[data-testid="cell"] img').length >= 9,
  { timeout: 30000 },
);
console.log('demo grid rendered: 9 thumbnails (workers + blob images OK under CSP)');
await page.keyboard.press('3');
await page.keyboard.press('Enter');
await page.waitForSelector('[data-testid="loupe"]', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 1500));
const painted = await page.$eval('[data-testid="loupe"] canvas', (c) => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 400) if (d[i] > 0) return true;
  return false;
});
console.log('loupe painted under CSP:', painted);
console.log('CSP violations / page errors:', violations.length === 0 ? 'none' : violations);
await browser.close();
process.exit(violations.length === 0 && painted ? 0 : 1);
