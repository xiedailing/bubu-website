/** Usage: node scripts/verify-solution.cjs <playwright-module> <output-dir> [url] */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const [modulePath, output, url = 'http://127.0.0.1:5173'] = process.argv.slice(2);
  if (!modulePath || !output) throw new Error('Provide the Playwright module path and output directory.');
  const { chromium, devices } = require(modulePath);
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], results = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const width of [320, 390, 700, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url + '/#solution', { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        document.querySelectorAll('#solution img').forEach(img => img.loading = 'eager');
        await document.fonts.ready;
        await Promise.all([...document.querySelectorAll('#solution img')].map(img => img.decode()));
      });
      const layout = await page.evaluate(() => {
        const section = document.querySelector('#solution');
        return {
          width: innerWidth, documentWidth: document.documentElement.scrollWidth,
          chapterTop: section.getBoundingClientRect().top,
          headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
          panels: section.querySelectorAll('.solution-panel').length,
          screens: [...section.querySelectorAll('.phone-screen')].map(img => ({
            source: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0,
            width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
          })),
          // Login's ::after is the intentional horizontal connector outside its pill.
          overflow: [...section.querySelectorAll('h2,h3,h4,p:not(.architecture-login),.flow-step-heading')].filter(el =>
            el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
          ).map(el => el.textContent.trim()),
          illustrations: [...section.querySelectorAll('.direction-illustration')].map(img => ({
            source: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0,
            width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
          })),
          badgeOverlaps: [...section.querySelectorAll('.direction-card')].some(card => {
            const a = card.querySelector('.insight-badge').getBoundingClientRect();
            const b = card.querySelector('.direction-illustration').getBoundingClientRect();
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          }),
        };
      });
      assert(layout.documentWidth <= width, JSON.stringify(layout));
      assert.equal(layout.panels, 3);
      assert.equal(layout.badgeOverlaps, false);
      assert.deepEqual(await page.locator('.direction-card .insight-badge').allTextContents(), ['核心', '輔助', '情境延伸']);
      assert.equal(await page.locator('.architecture-shortcut').count(), 0);
      assert.equal(await page.locator('#architecture-title').textContent(), '三個主要入口，快速找到需要的功能。');
      assert.deepEqual(layout.overflow, [], JSON.stringify(layout));
      assert(layout.chapterTop >= layout.headerBottom, JSON.stringify(layout));
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '03 解法');
      assert.equal(layout.screens.length, 0);
      assert.equal(await page.locator('#solution .solution-flow, #solution .solution-tradeoffs').count(), 0);
      assert(layout.illustrations.every(img => img.loaded && img.width > 100 && img.height >= 106));
      if ([390, 1440].includes(width)) {
        await page.screenshot({ path: path.join(output, `${width}-solution-viewport.png`) });
        const panels = page.locator('.solution-panel');
        for (let i = 0; i < await panels.count(); i++) {
          await panels.nth(i).screenshot({ path: path.join(output, `${width}-solution-${i+1}.png`), style: '.site-header { visibility: hidden; }' });
        }
      }
      await page.locator('.chapter-list a[href="#research"]').click();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#research');
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#solution');
      results.push(layout);
    }
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const phone = await context.newPage();
    await phone.goto(url + '/#solution', { waitUntil: 'networkidle' });
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ results, mobileTouch: 'passed', errors }, null, 2));
    console.log(JSON.stringify({ widths: results.map(r => r.width), mobileTouch: 'passed', errors }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
