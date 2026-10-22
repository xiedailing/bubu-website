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
    const retained = ['.architecture-tree', '.results-product-card'];
    const baseline = await page.evaluate(({ old, retained }) => {
      const previous = new DOMParser().parseFromString(old, 'text/html');
      return retained.map(selector => ({ selector, html: [...previous.querySelectorAll(selector)].slice(0, selector === '.results-product-card' ? 3 : undefined).map(el => el.outerHTML) }));
    }, { old, retained });
    for (const item of baseline) {
      assert.deepEqual(await page.locator(item.selector).evaluateAll(els => els.map(el => el.outerHTML)), item.html, `Deferred/retained content changed: ${item.selector}`);
    }
    // 2026-10-23 revision: intro page, persona, journey with emotion curve, features, design chapter, renumbering.
    assert.deepEqual(await page.locator('.chapter-list a').allTextContents(), ['01 介紹', '02 研究', '03 洞察', '04 解法', '05 迭代', '06 Demo', '07 設計', '08 成果']);
    assert.equal(await page.locator('#overview-label').innerText(), '01 / 介紹');
    assert.equal(await page.locator('.overview-intro .chapter-label').innerText(), '01 / 前言');
    assert.equal(await page.locator('#intro-title').textContent(), '你在生活中有遇過這些問題嗎？');
    assert.deepEqual(await page.locator('.moment-card h3').allTextContents(), ['洗澡時發現洗面乳沒有了', '上完廁所才發現衛生紙沒有了']);
    assert.deepEqual(await page.locator('.moment-image').evaluateAll(imgs => imgs.map(img => img.getAttribute('src').split('/').pop())), ['01-running-out.png', '01-toilet-paper-out.jpg']);
    assert.equal(await page.locator('link[rel=icon]').getAttribute('href'), './public/assets/bubu-logo.svg');
    assert.deepEqual(await page.locator('.brand-logo').evaluate(img => [img.naturalWidth, img.naturalHeight]), [57, 42]);
    assert.deepEqual(await page.locator('.persona-tag').allTextContents(), ['Persona A', 'Persona B']);
    assert.deepEqual(await page.locator('.persona-who').allTextContents(), ['林佳穎｜27 歲・行銷企劃', '陳筱安｜25 歲・行政人員']);
    assert.equal(await page.locator('.persona-card li').count(), 8);
    assert(await page.locator('#research').evaluate(el => el.querySelector('.research-personas').compareDocumentPosition(el.querySelector('.research-journey')) & Node.DOCUMENT_POSITION_FOLLOWING), 'Persona precedes journey');
    assert.deepEqual(await page.locator('.journey-card p').allTextContents(), ['發現時，可能已經太晚。', '評估剩餘量與購買必要性。', '靠記憶、備忘錄或訊息保留需求。', '等待下班、順路或有空時購買。', '完成購買，仍可能需要確認結果。']);
    assert.equal(await page.locator('.emotion-face').count(), 5);
    assert.equal(await page.locator('.journey-conclusion').textContent(), '真正容易中斷的，不是購買，而是購買前的記住與交代。');
    assert.deepEqual(await page.locator('.feature-card h3').allTextContents(), ['購買清單', '記錄補貨', '共享空間', '我的用品', '補貨明細', '延後提醒']);
    assert.equal(await page.locator('body').evaluate(body => /共享與認領|共享為單機模擬/.test(body.innerText)), false);
    assert(await page.locator('#solution').evaluate(el => el.querySelector('.solution-features').compareDocumentPosition(el.querySelector('.solution-architecture')) & Node.DOCUMENT_POSITION_FOLLOWING), 'Features precede information architecture');
    assert.equal(await page.locator('#design-title').textContent(), '以「家人」為靈感，呈現溫暖、親切的日常感。');
    assert.equal(await page.locator('.swatch').count(), 12);
    assert.equal(await page.locator('#results-product-title').evaluate(el => el.closest('.results-panel').querySelector('.chapter-label').textContent.trim()), '08 / 產品結果');
    assert(await page.locator('#demo').evaluate(el => el.compareDocumentPosition(document.querySelector('#design')) & Node.DOCUMENT_POSITION_FOLLOWING));
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
      const ids = ['problem','research','insights','solution','iteration','demo','design','results'];
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
        for (const selector of ['.overview-intro','.research-methods','.research-competition','.research-personas','.research-journey','.solution-features','.design','.research-opportunities','.insights-overview','.solution-directions','.iteration-observations','.iteration-b','.results-product','.results-tools','.results-team','.results-future']) {
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
