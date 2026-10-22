/** Usage: node scripts/verify-presentation-revision.cjs <playwright-module> [url] */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

async function main() {
  const { chromium } = require(process.argv[2] || 'playwright');
  const base = process.argv[3] || 'http://127.0.0.1:5173';
  const output = path.join(__dirname, '../artifacts/revision-2026-10-22');
  fs.mkdirSync(output, { recursive: true });
  const spec = fs.readFileSync(path.join(__dirname, '../docs/presentation-revision-spec-2026-10-22.md'), 'utf8');
  const old = execFileSync('git', ['show', 'HEAD:index.html'], { encoding: 'utf8' });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], results = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(base, { waitUntil: 'networkidle' });
    // Requirements whose content must survive this revision unchanged.
    const retained = ['.brand-logo', '.everyday-moments', '.journey-list', '.architecture-tree', '.results-product-card'];
    const baseline = await page.evaluate(({ old, retained }) => {
      const previous = new DOMParser().parseFromString(old, 'text/html');
      return retained.map(selector => ({ selector, html: [...previous.querySelectorAll(selector)].slice(0, selector === '.results-product-card' ? 3 : undefined).map(el => el.outerHTML) }));
    }, { old, retained });
    for (const item of baseline) {
      assert.deepEqual(await page.locator(item.selector).evaluateAll(els => els.map(el => el.outerHTML)), item.html, `Deferred/retained content changed: ${item.selector}`);
    }
    assert.equal(await page.locator('.research-note,.research-takeaways,.journey-takeaway,.insights-definition,.architecture-shortcut,.iteration-c,.iteration-detail,.results-learning').count(), 0);
    assert.deepEqual(await page.locator('.method-card h3').allTextContents(), ['1.競品分析', '2.問卷調查', '3.深入訪談']);
    assert.deepEqual(await page.locator('.method-number').allTextContents(), ['3', '47', '6']);
    assert.deepEqual(await page.locator('.direction-number').allTextContents(), ['設計決策 01', '設計決策 02', '設計決策 03']);
    assert.equal(await page.locator('.solution-directions .chapter-label').innerText(), '04 / 設計決策');
    assert.equal(await page.locator('.iteration-response').count(), 2);
    assert.equal(await page.locator('.iteration-b #iteration-b-title').innerText(), 'B｜不用在新增時，先猜下次補貨日期');
    assert.equal(await page.locator('#iteration').innerText().then(text => /目前部[署屬]版|設計迭代 C/.test(text)), false);
    assert.deepEqual(await page.locator('.direction-card .insight-badge').allTextContents(), ['核心', '輔助', '情境延伸']);
    assert.equal(await page.locator('.direction-card').nth(1).locator('p').textContent(), '參考歷史補貨紀錄掌握時機，也能延後提醒，彈性安排採買');
    assert.equal(await page.locator('#results-product-title').textContent(), '我們和競品不同的地方');
    assert.equal(await page.locator('#results-tools-title').textContent(), '主要技術工具');
    assert.equal(await page.locator('#results-future-title').textContent(), '未來展望');
    const dimensions = ['分析維度', '商品定位', '優點', '缺點', '目標使用者'];
    const rows = spec.split('\n').filter(line => dimensions.some(key => line.startsWith(`| ${key} |`))).map(line => line.trim().slice(1,-1).split('|').map(cell => cell.trim()));
    const table = await page.locator('.comparison-table tr').evaluateAll(rows => rows.map(row => [...row.cells].map(cell => cell.querySelector('ul') ? [...cell.querySelectorAll('li')].map(li => li.textContent).join('；') : cell.textContent)));
    assert.deepEqual(table, rows);
    assert.equal(await page.locator('.competition-conclusion').count(), 0);
    assert.deepEqual(await page.locator('.comparison-table tbody th').allTextContents(), ['商品定位', '目標使用者', '優點', '缺點']);
    assert.equal(await page.locator('#research-title').textContent(), '研究方法&流程');
    assert.equal(await page.locator('.research-scenarios').count(), 0);
    assert.deepEqual(await page.locator('.finding-card h3').allTextContents(), ['研究發現 01', '研究發現 02']);
    assert.equal(await page.locator('.insights-note,.solution-flow,.solution-tradeoffs,.solution-next').count(), 0);
    assert.deepEqual(await page.locator('.insight-evidence strong').allTextContents(), ['研究發現 02、機會點 02', '研究發現 01', '機會點 01']);
    assert.equal(await page.locator('.solution-note,.demo-backup,.demo-note').count(), 0);
    assert.deepEqual(await page.locator('.iteration-screen figcaption').allInnerTexts(), ['空間選擇 UI 不明確', '空間選擇 UI 重新設計', '「＋」展開選單', '新增用品・\n選擇預計補貨日', '記錄補貨・精簡表單', '補貨明細・歷史紀錄']);
    assert.equal(await page.locator('.iteration-trio .iteration-version-row > img').count(), 2);
    assert.equal(await page.locator('.research-opportunities').evaluate(el => el.closest('.research-competition') !== null), true, 'Opportunities share the competition page');
    for (const button of await page.locator('.row-toggle').all()) {
      const body = button.locator('xpath=ancestor::tr//td[1]/div');
      await button.click();
      assert.equal(await button.getAttribute('aria-expanded'), 'false');
      assert.equal(await body.isVisible(), false);
      await button.click();
      assert.equal(await button.getAttribute('aria-expanded'), 'true');
      assert.equal(await body.isVisible(), true);
    }
    assert.deepEqual(await page.locator('.opportunity-card h3').allTextContents(), ['共享功能的責任分配', '降低輸入成本']);
    assert.equal(await page.locator('.research-opportunities .opportunity-card').count(), 2);
    assert(await page.locator('.comparison-table tbody tr').evaluateAll(rows => rows.every((row, index) =>
      [...row.cells].every(cell => {
        const style = getComputedStyle(cell);
        return index === rows.length - 1 ? parseFloat(style.borderBottomWidth) === 0 : style.borderBottomStyle === 'solid' && parseFloat(style.borderBottomWidth) >= 1;
      })
    )), 'Comparison rows except the last must have a visible separator');
    const tools = spec.split('\n').filter(line => /^\| (Vue 3、Vite|Vue Router|Pinia|Bootstrap 5、Sass|Font Awesome、Google Fonts|localStorage|Git、GitHub、Vercel) \|/.test(line)).map(line => line.trim().slice(1,-1).split('|').map(cell => cell.trim()));
    assert.deepEqual(await page.locator('.tools-table tbody tr').evaluateAll(rows => rows.map(row => [...row.cells].map(cell => cell.textContent))), tools);
    for (const copy of spec.split('### 3.6')[1].split('驗收：')[0].split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(2))) {
      assert((await page.locator('.results-team').innerText()).replace(/\s/g,'').includes(copy.replace(/\s/g,'').replace('：','')), `Missing contribution: ${copy}`);
    }
    for (const width of [320, 390, 700, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach(img => img.loading = 'eager');
        await document.fonts.ready;
        await Promise.all([...document.images].map(img => img.decode()));
      });
      const integrity = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          duplicates: ids.filter((id, index) => ids.indexOf(id) !== index),
          brokenLabels: [...document.querySelectorAll('[aria-labelledby]')].flatMap(el => el.getAttribute('aria-labelledby').split(/\s+/).filter(id => !document.getElementById(id))),
          brokenLinks: [...document.querySelectorAll('a[href^="#"]')].filter(el => !document.getElementById(el.hash.slice(1))).map(el => el.hash),
          // These diagram elements intentionally extend connector lines into gaps.
          clipped: [...document.querySelectorAll('h1,h2,h3,h4,p:not(.architecture-login),li:not(.flow-step),td,th')].filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent),
          cardOrder: [...document.querySelectorAll('.direction-card')].every(card => {
            const els = ['.direction-label','h3','p','img'].map(s => card.querySelector(s).getBoundingClientRect());
            return els.every((rect, i) => !i || rect.top >= els[i-1].bottom - 1);
          }),
        };
      });
      assert.deepEqual(integrity, { overflow: false, duplicates: [], brokenLabels: [], brokenLinks: [], clipped: [], cardOrder: true }, JSON.stringify({ width, integrity }));
      const ids = ['problem','research','insights','solution','iteration','demo','results'];
      for (const id of ids) {
        await page.locator(`.chapter-list a[href="#${id}"]`).click();
        await page.waitForFunction(id => document.querySelector('.chapter-list a[aria-current]')?.hash === `#${id}`, id);
        assert(await page.locator('#'+id).evaluate(el => el.getBoundingClientRect().top >= document.querySelector('.site-header').getBoundingClientRect().bottom));
      }
      // Manual scrolling in both directions must override stale hashes.
      for (const id of [...ids].reverse().concat(ids)) {
        await page.locator('#'+id).evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight));
        await page.waitForFunction(id => document.querySelector('.chapter-list a[aria-current]')?.hash === `#${id}`, id);
        assert(await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().top === 0));
      }
      if (width === 390 || width === 1440) {
        for (const selector of ['.research-methods','.research-competition','.research-opportunities','.insights-overview','.solution-directions','.iteration-observations','.iteration-b','.results-product','.results-tools','.results-team','.results-future']) {
          await page.locator(selector).screenshot({ path: path.join(output, `${width}-${selector.slice(1)}.png`), style: '.site-header { visibility: hidden; }' });
        }
        await page.goto(base+'/#research', { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(output, `${width}-navigation.png`) });
      }
      results.push({ width, status: 'passed' });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ results, errors, retained: retained, content: 'passed', navigation: 'click/hash/scroll both directions passed', physicalDevices: 'not tested' }, null, 2));
    console.log(JSON.stringify({ results, errors }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
