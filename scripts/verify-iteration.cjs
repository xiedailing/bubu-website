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
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '04 迭代');
      const sources = [3,4,5].map(i => `./public/assets/05a-screen-${i}.png`)
        .concat(['./public/assets/05c-screen-1.png', './public/assets/05b-record-restock.png', './public/assets/05c-screen-3.png']);
      assert.equal(layout.images.length, 6);
      assert.equal(await page.locator('.iteration-c,.iteration-detail,.iteration-note').count(), 0);
      assert.equal(await page.locator('.iteration-observations .iteration-stat').count(), 1);
      assert.equal(await page.locator('.iteration-b').count(), 1);
      assert.equal(await page.locator('.iteration-response').count(), 2);
      assert.equal(await page.locator('.iteration-b .iteration-stat strong').innerText(), '3 / 7');
      assert.equal(await page.locator('.iteration-b .iteration-stat h3').innerText(), '難以自行估算下一次補貨時間');
      assert.equal(await page.locator('.iteration-observations .iteration-stat h3').innerText(), '新增空間列為最卡任務');
      assert.equal(await page.locator('.iteration-observations .iteration-stat p').innerText(), '新增空間入口在哪裡？');
      assert.equal(await page.locator('.iteration-b figcaption').nth(1).innerText(), '記錄補貨・精簡表單');
      if (width >= 701) {
        assert(await page.locator('.iteration-response h3').evaluateAll(headings => headings.every(h => {
          const range = document.createRange(); range.selectNodeContents(h);
          return range.getClientRects().length === 1 && h.scrollWidth <= h.clientWidth;
        })), 'Response headings must fit on one line');
      }
      assert.equal(await page.locator('.iteration-observations .iteration-response h3').innerText(), '調整導覽、空間切換UI與新增入口');
      assert.deepEqual(await page.locator('.iteration-observations .iteration-response dd').allTextContents(), ['首頁：四項主要導覽和+新增用品CTA', '我的用品：三項主要導覽與調整新增CTA功能']);
      assert.equal(await page.locator('.iteration-b .iteration-response h3').innerText(), '從「預估日期」到「累積紀錄」');
      assert.deepEqual(await page.locator('.iteration-b .iteration-response p').allTextContents(), ['取消新增時提供下次補貨日期，改以記錄補貨留下資料。', '紀錄足夠才提供參考；不足時顯示對應提示。']);
      const arrangement = await page.locator('.iteration-panel').evaluateAll(panels => panels.map(panel => {
        const stat = panel.querySelector('.iteration-stat').getBoundingClientRect();
        const heading = panel.querySelector('.iteration-stat h3').getBoundingClientRect();
        const response = panel.querySelector('.iteration-response').getBoundingClientRect();
        const images = panel.querySelector('.iteration-comparison').getBoundingClientRect();
        return { statBelowResponse: response.top > stat.bottom, hugged: stat.width <= heading.width + 60,
          twoColumns: response.right <= images.left, imageWidth: images.width,
          columns: getComputedStyle(panel.querySelector('.iteration-overview')).gridTemplateColumns };
      }));
      assert(arrangement.every(item => item.statBelowResponse && item.hugged), JSON.stringify(arrangement));
      assert.equal(arrangement[0].columns, arrangement[1].columns);
      assert.equal(arrangement[0].imageWidth, arrangement[1].imageWidth);
      if (width >= 1400) assert(arrangement.every(item => item.twoColumns));
      layout.images.forEach((img, i) => {
        assert.equal(img.src, sources[i]);
        assert(img.loaded);
        const expectedHeight = 500;
        assert(img.height > 100 && img.height <= expectedHeight + 1, JSON.stringify(img));
        assert(Math.abs(img.width / img.height - img.ratio) < .001);
      });
      if ([390, 1440].includes(width)) {
        for (let i = 0; i < 2; i++) await page.locator('.iteration-panel').nth(i).screenshot({ path: path.join(output, `${width}-iteration-${i+1}.png`), style: '.site-header { visibility: hidden; }' });
      }
      const previews = page.locator('.iteration-preview');
      for (let i = 0; i < 6; i++) {
        await previews.nth(i).focus();
        await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
        assert(await page.locator('.image-dialog').evaluate(el => el.open));
        assert.deepEqual(await page.locator('.image-dialog-content').evaluateAll(images => images.map(img => img.getAttribute('src'))), sources.slice(i < 3 ? 0 : 3, i < 3 ? 3 : 6));
        await page.locator('[data-zoom="in"]').click();
        assert.equal(await page.locator('.image-dialog-level').textContent(), '150%');
        await page.locator('[data-zoom="out"]').click();
        if (i === 5) await page.locator('.image-dialog-close').click();
        else await page.keyboard.press('Escape');
        assert(await previews.nth(i).evaluate(el => el === document.activeElement));
      }
      await page.locator('.chapter-list a[href="#solution"]').click();
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]')?.hash === '#iteration');
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '04 迭代');
      results.push(layout);
    }
    const context = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const phone = await context.newPage();
    await phone.goto(url + '/#iteration', { waitUntil: 'networkidle' });
    for (const selector of ['.iteration-observations .iteration-preview', '.iteration-b .iteration-preview']) {
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
