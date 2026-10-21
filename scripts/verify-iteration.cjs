/** Usage: node scripts/verify-iteration.cjs <playwright-module> <output-dir> [url] */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const [modulePath, output, url = 'http://127.0.0.1:5173'] = process.argv.slice(2);
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
      await page.goto(url + '/#iteration', { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        document.querySelectorAll('#iteration img').forEach(img => img.loading = 'eager');
        await document.fonts.ready;
        await Promise.all([...document.querySelectorAll('#iteration img')].map(img => img.decode()));
      });
      const layout = await page.evaluate(() => {
        const section = document.querySelector('#iteration');
        return {
          width: innerWidth, documentWidth: document.documentElement.scrollWidth,
          top: section.getBoundingClientRect().top,
          headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
          overflow: [...section.querySelectorAll('h2,h3,p,dd,figcaption')].filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(el => el.textContent),
          images: [...section.querySelectorAll('.iteration-phone img')].map(img => ({
            src: img.getAttribute('src'), loaded: img.naturalWidth > 0,
            width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
            ratio: img.naturalWidth / img.naturalHeight,
          })),
        };
      });
      assert(layout.documentWidth <= width, JSON.stringify(layout));
      assert(layout.top >= layout.headerBottom, JSON.stringify(layout));
      assert.deepEqual(layout.overflow, []);
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '05 迭代');
      const sources = [1,2,3,4,5].map(i => `./public/assets/05a-screen-${i}.png`)
        .concat([1,2].map(i => `./public/assets/05b-screen-${i}.png`), [1,2,3].map(i => `./public/assets/05c-screen-${i}.png`));
      assert.equal(layout.images.length, 10);
      layout.images.forEach((img, i) => {
        assert.equal(img.src, sources[i]);
        assert(img.loaded);
        const expectedHeight = i >= 2 && i < 5 ? 540 : 500;
        assert.equal(img.height, expectedHeight);
        assert(Math.abs(img.width / img.height - img.ratio) < .001);
      });
      if ([390, 1440].includes(width)) {
        for (let i = 0; i < 4; i++) await page.locator('.iteration-panel').nth(i).screenshot({ path: path.join(output, `${width}-iteration-${i+1}.png`), style: '.site-header { visibility: hidden; }' });
      }
      const previews = page.locator('.iteration-preview');
      for (let i = 0; i < 10; i++) {
        await previews.nth(i).focus();
        await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
        assert(await page.locator('.image-dialog').evaluate(el => el.open));
        assert.equal(await page.locator('.image-dialog-content').getAttribute('src'), sources[i]);
        if (i === 9) await page.locator('.image-dialog-close').click();
        else await page.keyboard.press('Escape');
        assert(await previews.nth(i).evaluate(el => el === document.activeElement));
      }
      await page.locator('.chapter-list a[href="#solution"]').click();
      await page.goBack();
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '05 迭代');
      results.push(layout);
    }
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const phone = await context.newPage();
    await phone.goto(url + '/#iteration', { waitUntil: 'networkidle' });
    for (const selector of ['.iteration-preview', '.iteration-b .iteration-preview', '.iteration-c .iteration-preview']) {
      await phone.locator(selector).first().tap();
      assert(await phone.locator('.image-dialog').evaluate(el => el.open));
      await phone.locator('.image-dialog-close').tap();
    }
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ results, mobileTouch: 'passed', errors }, null, 2));
    console.log(JSON.stringify({ widths: results.map(r => r.width), mobileTouch: 'passed', errors }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
