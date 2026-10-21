"""Check chapter 06 on desktop and emulated phones; requires a local server."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
output = root / 'artifacts/demo-qa'
output.mkdir(parents=True, exist_ok=True)
errors, results = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)
    for width in (320, 390, 700, 768, 1024, 1280, 1440, 1920):
        page.set_viewport_size({'width': width, 'height': 900})
        page.goto('http://127.0.0.1:5173/#demo', wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        expect(page.locator('.chapter-list a[href="#demo"]')).to_have_attribute('aria-current', 'location')
        layout = page.locator('#demo').evaluate('''section => ({
          width: innerWidth, documentWidth: document.documentElement.scrollWidth,
          top: section.getBoundingClientRect().top,
          headerBottom: document.querySelector('.site-header').getBoundingClientRect().bottom,
          columns: getComputedStyle(section.querySelector('.demo-scenarios')).gridTemplateColumns.split(' ').length,
          clipped: [...section.querySelectorAll('p,h2,h3,li,a,span')].filter(el => el.clientWidth && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.textContent),
          images: [...section.querySelectorAll('img')].map(img => ({loaded: img.complete && img.naturalWidth > 0, width: img.width, height: img.height, src: img.getAttribute('src')}))
        })''')
        assert layout['documentWidth'] <= width, layout
        assert layout['top'] >= layout['headerBottom'], layout
        assert not layout['clipped'], layout
        assert layout['columns'] == (1 if width <= 700 else 2), layout
        assert len(layout['images']) == 3
        assert all(img == {'loaded': True, 'width': 10, 'height': 10, 'src': './public/assets/chapter-dot.svg'} for img in layout['images'])
        assert page.locator('.demo-steps').nth(0).locator('li').count() == 4
        assert page.locator('.demo-steps').nth(1).locator('li').count() == 3
        launch = page.locator('.demo-launch')
        expect(launch).to_have_attribute('href', 'https://home-restock-app.vercel.app/login')
        expect(launch).to_have_attribute('target', '_blank')
        launch.focus()
        page.keyboard.press('Tab')
        page.keyboard.press('Shift+Tab')
        assert launch.evaluate("el => el.matches(':focus-visible')")
        # Verify native keyboard activation and new-tab routing without modifying the product.
        page.context.route('https://home-restock-app.vercel.app/**', lambda route: route.fulfill(body='Demo destination verified', content_type='text/html'))
        with page.expect_popup() as popup_info:
            page.keyboard.press('Enter')
        popup = popup_info.value
        popup.wait_for_load_state()
        assert popup.url == 'https://home-restock-app.vercel.app/login'
        popup.close()
        if width in (390, 1440):
            launch.evaluate('el => el.blur()')
            page.locator('#demo').evaluate("el => scrollTo(0, el.offsetTop - document.querySelector('.site-header').offsetHeight)")
            page.screenshot(path=str(output / f'{width}-demo-viewport.png'))
            page.locator('#demo').screenshot(path=str(output / f'{width}-demo-section.png'), style='.site-header { visibility: hidden; }')
        # Existing navigation/history and all completed chapter content remain available.
        page.locator('.chapter-list a[href="#iteration"]').click()
        expect(page.locator('.chapter-list a[href="#iteration"]')).to_have_attribute('aria-current', 'location')
        page.go_back()
        expect(page.locator('.chapter-list a[href="#demo"]')).to_have_attribute('aria-current', 'location')
        for selector, count in (('.iteration-panel', 4), ('#iteration .flow-preview', 10), ('#solution .solution-panel', 6), ('.research-heading h2', 4), ('.insight-card', 3), ('.hero-image', 1)):
            assert page.locator(selector).count() == count, selector
        results.append(layout)
    mobile = browser.new_context(**p.devices['iPhone 13'], reduced_motion='reduce')
    phone = mobile.new_page()
    phone.goto('http://127.0.0.1:5173/#iteration', wait_until='networkidle')
    phone.locator('.chapter-list a[href="#demo"]').tap()
    expect(phone.locator('.chapter-list a[href="#demo"]')).to_have_attribute('aria-current', 'location')
    assert phone.evaluate('document.documentElement.scrollWidth <= innerWidth')
    mobile.close()
    browser.close()
assert not errors, errors
(output / 'report.json').write_text(json.dumps({'results': results, 'mobileTouch': 'passed', 'keyboardNewTab': 'passed', 'errors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'widths': [r['width'] for r in results], 'mobileTouch': 'passed', 'keyboardNewTab': 'passed', 'errors': errors}))
