/** Design-direction page (end of chapter 02) browser checks. Usage: node scripts/verify-insights.cjs <playwright-module> <output-dir> [url] */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const [modulePath, output, url = 'http://127.0.0.1:5173'] = process.argv.slice(2);
  if (!modulePath || !output) throw new Error('Provide the Playwright module path and screenshot output directory.');
  const { chromium, devices } = require(modulePath);
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  const results = [];
  const monitor = page => {
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
  };
  try {
    const page = await browser.newPage();
    monitor(page);
    for (const width of [320, 390, 700, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.insights').scrollIntoViewIfNeeded();
      const layout = await page.evaluate(() => {
        const chapter = document.querySelector('.insights');
        const cards = [...chapter.querySelectorAll('.insight-card')];
        const clipped = [...chapter.querySelectorAll('h2,h3,p,span,strong')].filter(el =>
          el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        ).map(el => el.textContent.trim());
        return {
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          chapterTop: chapter.getBoundingClientRect().top,
          headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
          cardCount: cards.length,
          columns: getComputedStyle(document.querySelector('.insight-grid')).gridTemplateColumns.split(' ').length,
          clipped,
          images: [...chapter.querySelectorAll('img')].map(img => ({
            valid: img.complete && img.naturalWidth > 0,
            width: img.getBoundingClientRect().width,
            height: img.getBoundingClientRect().height,
            source: img.getAttribute('src'),
          })),
          font: getComputedStyle(chapter).fontFamily,
        };
      });
      assert(layout.documentWidth <= width, JSON.stringify(layout));
      assert.equal(await page.locator('#insights').count(), 0, 'Chapter 03 removed');
      assert.equal(await page.locator('#research .insights .insights-overview').count(), 1);
      assert.equal(await page.locator('.chapter-list a').nth(1).textContent(), '02 使用者研究與洞察');
      assert.equal(layout.cardCount, 3);
      assert.equal(await page.locator('.insights-definition').count(), 0);
      assert.deepEqual(await page.locator('.insight-card h3').allTextContents(), ['如何讓使用者延後購買時，也不忘記待買需求？', '如何讓使用者提早掌握補貨時機，而不是用完才發現？', '如何讓補貨交辦更清楚，減少責任與進度不明的情況？']);
      assert.equal(await page.locator('.insight-card h3 br').count(), 6, 'Phrase-level line breaks');
      assert.deepEqual(await page.locator('.insight-description').allTextContents(), ['對應研究：知道要買，卻在真正購買前忘記。', '對應研究：用品快用完時，才察覺需要補貨。', '對應研究：交代他人購買後，不確定是否完成。']);
      assert.equal(await page.locator('.insights .insight-evidence, .insights .insight-badge').count(), 0);
      assert.equal(await page.locator('.insights .chapter-label').first().innerText(), '02 / 使用者研究與洞察 • 問題定義');
      assert.deepEqual(await page.locator('.insight-label .chapter-label').allInnerTexts(), ['問題 01', '問題 02', '問題 03']);
      assert.equal(await page.locator('#insights-title').textContent(), '從研究發現出發，我們想解決哪些問題？');
      assert.equal(layout.columns, width <= 1100 ? 1 : 3);
      assert.deepEqual(layout.clipped, []);
      assert.equal(layout.images.length, 4);
      assert(layout.images.every(img => img.valid && img.width === 10 && img.height === 10 && img.source === './public/assets/chapter-dot.svg'));
      if ([390, 1440].includes(width)) {
        await page.screenshot({ path: path.join(output, `${width}-insights-viewport.png`) });
        for (const panel of ['overview']) {
          const clip = await page.locator(`.insights-${panel}`).evaluate(el => {
            const rect = el.getBoundingClientRect();
            return { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height };
          });
          await page.screenshot({
            path: path.join(output, `${width}-insights-${panel}.png`),
            fullPage: true,
            clip,
            style: '.site-header { visibility: hidden; }',
          });
        }
      }
      // Existing chapter links, browser history, and the homepage still work.
      await page.locator('.chapter-list a[href="#solution"]').click();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#solution');
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '03 解法');
      await page.locator('.chapter-list a[href="#research"]').click();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#research');
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '02 使用者研究與洞察');
      await page.goBack();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#solution');
      await page.goForward();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#research');
      assert.equal(await page.locator('.research-heading h2').count(), 5);
      await page.locator('.brand').click();
      await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]').hash === '#problem');
      assert.equal(await page.locator('.chapter-list a[aria-current]').textContent(), '01 概述');
      results.push(layout);
    }
    // Touch-enabled mobile viewport, direct URL entry, and reduced motion.
    const mobile = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
    const phone = await mobile.newPage();
    monitor(phone);
    await phone.goto(`${url}/#research`, { waitUntil: 'networkidle' });
    assert.equal(await phone.locator('.chapter-list a[aria-current]').textContent(), '02 使用者研究與洞察');
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await phone.screenshot({ path: path.join(output, '390-insights-touch.png') });
    await mobile.close();
    await page.setViewportSize({ width: 720, height: 450 });
    await page.goto(`${url}/#research`, { waitUntil: 'networkidle' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.deepEqual(errors, []);
    const report = { browser: 'Microsoft Edge', results, mobileTouch: 'passed', reflow720: 'passed', errors };
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ widths: results.map(r => r.width), mobileTouch: 'passed', errors }, null, 2));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
