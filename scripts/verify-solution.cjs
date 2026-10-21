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
      assert.equal(layout.panels, 6);
      assert.equal(layout.badgeOverlaps, false);
      assert.deepEqual(layout.overflow, [], JSON.stringify(layout));
      assert(layout.chapterTop >= layout.headerBottom, JSON.stringify(layout));
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '04 解法');
      assert.equal(layout.screens.length, 9);
      layout.screens.forEach((img, i) => {
        assert.equal(img.source, `./public/assets/04-flow-${i + 1}.png`);
        assert(img.loaded && Math.abs(img.width - 244.905) < .05 && img.height === 530, JSON.stringify(img));
      });
      assert(layout.illustrations.every(img => img.loaded && img.width > 100 && img.height >= 106));
      if ([390, 1440].includes(width)) {
        await page.screenshot({ path: path.join(output, `${width}-solution-viewport.png`) });
        const panels = page.locator('.solution-panel');
        for (let i = 0; i < await panels.count(); i++) {
          await panels.nth(i).screenshot({ path: path.join(output, `${width}-solution-${i+1}.png`), style: '.site-header { visibility: hidden; }' });
        }
      }
      // Each screenshot opens the correct full-resolution image. Escape restores focus.
      const previews = page.locator('#solution .flow-preview');
      for (let i = 0; i < await previews.count(); i++) {
        await previews.nth(i).click();
        assert(await page.locator('.image-dialog').evaluate(el => el.open));
        assert.equal(await page.locator('.image-dialog-content').getAttribute('src'), `./public/assets/04-flow-${i+1}.png`);
        await page.keyboard.press('Escape');
        assert(await previews.nth(i).evaluate(el => el === document.activeElement));
      }
      await previews.first().click();
      await page.locator('.image-dialog-close').click();
      assert(!(await page.locator('.image-dialog').evaluate(el => el.open)));
      await page.locator('.chapter-list a[href="#insights"]').click();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#insights');
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#solution');
      results.push(layout);
    }
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const phone = await context.newPage();
    await phone.goto(url + '/#solution', { waitUntil: 'networkidle' });
    await phone.locator('.flow-preview').first().tap();
    assert(await phone.locator('.image-dialog').evaluate(el => el.open));
    await phone.locator('.image-dialog-close').tap();
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ results, mobileTouch: 'passed', errors }, null, 2));
    console.log(JSON.stringify({ widths: results.map(r => r.width), mobileTouch: 'passed', errors }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
