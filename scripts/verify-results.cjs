/** Usage: node scripts/verify-results.cjs <playwright-module> [base-url] */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { chromium, devices } = require(process.argv[2] || 'playwright');
  const base = process.argv[3] || 'http://127.0.0.1:5173';
  const output = path.join(__dirname, '../artifacts/results-qa');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], results = [];
  const recordErrors = page => {
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
  };
  async function inspect(page, label) {
    await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]')?.hash === '#results');
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.locator('#results').evaluate(section => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      columns: ['product', 'team'].map(name => getComputedStyle(section.querySelector(`.results-${name}-grid`)).gridTemplateColumns.split(' ').length),
      panels: [...section.querySelectorAll('.results-panel')].map(el => ({ height: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top + scrollY })),
      clipped: [...section.querySelectorAll('p,h2,h3,h4,li,span')].filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent),
      images: [...section.querySelectorAll('img')].map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0, width: img.width, height: img.height })),
      font: getComputedStyle(section).fontFamily,
    }));
    assert(layout.documentWidth <= layout.width, JSON.stringify(layout));
    assert.deepEqual(layout.clipped, []);
    assert.deepEqual(layout.columns, layout.width <= 700 ? [1, 1] : layout.width <= 1100 ? [2, 2] : [3, 2]);
    assert.equal(layout.panels.length, 5);
    assert(layout.panels.every(panel => panel.height > 0));
    assert.equal(layout.images.length, 5);
    assert(layout.images.every(img => img.loaded && (img.src.endsWith('07-bubu-logo.svg') ? img.width === 60 && img.height === 45 : img.width === 10 && img.height === 10)));
    assert(layout.font.includes('Chiron GoRound TC Results'));
    assert.equal(await page.locator('.results-product-card').count(), 3);
    assert.equal(await page.locator('.results-learning').count(), 0);
    assert.equal(await page.locator('.results-team-card').count(), 2);
    assert.equal(await page.locator('.tools-table tbody tr').count(), 7);
    assert.equal(await page.locator('.results-collaboration li').count(), 4);
    assert.equal(await page.locator('.results-future-list li').count(), 8);
    assert.equal(await page.locator('.site-header').count(), 1);
    assert.equal(await page.locator('.chapter-list a[aria-current]').getAttribute('href'), '#results');
    const headerBottom = await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().bottom);
    const headingTop = await page.locator('#results-product-title').evaluate(el => el.getBoundingClientRect().top);
    assert(headingTop >= headerBottom, 'Chapter heading hidden behind sticky header');
    results.push({ label, ...layout });
  }
  try {
    const page = await browser.newPage();
    recordErrors(page);
    for (const width of [320, 390, 700, 768, 1024, 1100, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/#results', { waitUntil: 'networkidle' });
      await inspect(page, `${width}px`);
      if ([390, 1440].includes(width)) {
        await page.screenshot({ path: path.join(output, `${width}-navigation.png`) });
        for (const name of ['product', 'tools', 'team', 'future', 'closing']) {
          await page.locator(`.results-${name}`).screenshot({ path: path.join(output, `${width}-${name}.png`), style: '.site-header { visibility: hidden; }' });
        }
      }
    }
    // Real keyboard navigation, URL history, and all existing chapter targets.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base + '/#demo', { waitUntil: 'networkidle' });
    const link = page.locator('.chapter-list a[href="#results"]');
    await link.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert(await link.evaluate(el => el.matches(':focus-visible')));
    await page.keyboard.press('Enter');
    await page.waitForURL('**/#results');
    await inspect(page, 'keyboard navigation');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]')?.hash === '#demo');
    assert.equal(await page.locator('.chapter-list a[aria-current]').getAttribute('href'), '#demo');
    await page.goForward();
    await page.waitForFunction(() => document.querySelector('.chapter-list a[aria-current]')?.hash === '#results');
    assert.equal(await page.locator('.chapter-list a[aria-current]').getAttribute('href'), '#results');
    for (const id of ['problem', 'research', 'insights', 'solution', 'iteration', 'demo', 'results']) {
      await page.locator(`.chapter-list a[href="#${id}"]`).click();
      await page.waitForFunction(id => document.querySelector('.chapter-list a[aria-current]')?.hash === '#' + id, id);
      assert.equal(await page.locator('.chapter-list a[aria-current]').getAttribute('href'), '#' + id);
      assert(await page.locator('#' + id).isVisible());
    }
    const mobile = await browser.newContext({ ...devices['iPhone 13'], defaultBrowserType: undefined, reducedMotion: 'reduce' });
    const touchPage = await mobile.newPage();
    recordErrors(touchPage);
    await touchPage.goto(base + '/#demo', { waitUntil: 'networkidle' });
    await touchPage.locator('.chapter-list a[href="#results"]').tap();
    await inspect(touchPage, 'iPhone 13 touch / reduced motion');
    await touchPage.locator('.results-closing').scrollIntoViewIfNeeded();
    await touchPage.screenshot({ path: path.join(output, 'iphone-closing.png') });
    await mobile.close();
    // Equivalent reflow width for a 1440px desktop at 200% browser zoom.
    await page.setViewportSize({ width: 720, height: 450 });
    await page.goto(base + '/#results', { waitUntil: 'networkidle' });
    await inspect(page, '200% equivalent reflow (720 CSS px)');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ results, errors, navigationAndHistory: 'passed', touchAndReducedMotion: 'passed', physicalPhone: 'not tested' }, null, 2));
    console.log(JSON.stringify({ widths: results.map(r => r.label), errors, navigationAndHistory: 'passed', touchAndReducedMotion: 'passed' }));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
