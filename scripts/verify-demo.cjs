/** Usage: node scripts/verify-demo.cjs <playwright-module> [base-url] */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { chromium } = require(process.argv[2] || 'playwright');
  const base = process.argv[3] || 'http://127.0.0.1:5173';
  const output = path.join(__dirname, '../artifacts/demo-current-qa');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], results = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    for (const width of [320, 390, 700, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/#demo', { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.locator('#demo').evaluate(section => ({
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        columns: getComputedStyle(section.querySelector('.demo-scenarios')).gridTemplateColumns.split(' ').length,
        clipped: [...section.querySelectorAll('p,h2,h3,li,a,span')].filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent),
        images: [...section.querySelectorAll('img')].map(img => ({ loaded: img.complete && img.naturalWidth > 0, width: img.width, height: img.height })),
      }));
      assert(layout.documentWidth <= width, JSON.stringify(layout));
      assert.equal(layout.columns, width <= 700 ? 1 : 2);
      assert.deepEqual(layout.clipped, []);
      assert.equal(layout.images.length, 3);
      assert(layout.images.every(img => img.loaded && img.width === 10 && img.height === 10));
      assert.equal(await page.locator('.demo-steps').nth(0).locator('li').count(), 4);
      assert.equal(await page.locator('.demo-steps').nth(1).locator('li').count(), 3);
      assert.equal(await page.locator('.chapter-list a[href="#demo"]').getAttribute('aria-current'), 'location');
      const launch = page.locator('.demo-launch');
      await launch.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      assert(await launch.evaluate(el => el.matches(':focus-visible')));
      await page.context().route('https://home-restock-app.vercel.app/**', route => route.fulfill({ body: 'Verified destination' }));
      const popupPromise = page.waitForEvent('popup');
      await page.keyboard.press('Enter');
      const popup = await popupPromise;
      await popup.waitForLoadState();
      assert.equal(popup.url(), 'https://home-restock-app.vercel.app/login');
      await popup.close();
      if ([390, 1440].includes(width)) {
        await launch.evaluate(el => el.blur());
        await page.locator('#demo').screenshot({ path: path.join(output, `${width}-demo.png`), style: '.site-header { visibility: hidden; }' });
      }
      results.push(layout);
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ results, errors, keyboardNewTab: 'passed', externalProductLogin: 'not tested' }, null, 2));
    console.log(JSON.stringify({ widths: results.map(r => r.width), errors, keyboardNewTab: 'passed' }));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
