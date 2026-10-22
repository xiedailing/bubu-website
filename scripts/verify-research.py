"""Browser checks for chapter 02. Requires Playwright, fonttools and a static server."""
import argparse
import json
from pathlib import Path

from fontTools.ttLib import TTFont
from playwright.sync_api import expect, sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5173")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--channel", default="msedge")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    results, errors, font_coverage = [], [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel=args.channel, headless=True)
        page = browser.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("response", lambda response: errors.append(f"HTTP {response.status}: {response.url}") if response.status >= 400 else None)
        for width in (320, 390, 700, 768, 1024, 1280, 1440, 1920):
            page.set_viewport_size({"width": width, "height": 900})
            page.goto(args.url, wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.locator('.chapter-list a[href="#research"]').click()
            page.wait_for_function("location.hash === '#research'")
            expect(page.locator('.chapter-list a[href="#research"]')).to_have_attribute('aria-current', 'location')
            layout = page.evaluate("""() => {
              const research = document.querySelector('#research');
              const header = document.querySelector('.site-header');
              const table = document.querySelector('.comparison-scroll');
              const clipped = [...research.querySelectorAll('h2,h3,h4,p')].filter(el =>
                el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
              ).map(el => el.textContent.trim());
              return {
                documentWidth: document.documentElement.scrollWidth,
                viewportWidth: innerWidth,
                anchorTop: research.getBoundingClientRect().top,
                headerBottom: header.getBoundingClientRect().bottom,
                tableScrollable: table.scrollWidth > table.clientWidth,
                clipped,
                imagesValid: [...research.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0 && img.width === 10 && img.height === 10),
                headings: [...research.querySelectorAll('.research-heading h2')].map(el => el.textContent)
              };
            }""")
            assert layout["documentWidth"] <= width, layout
            assert layout["anchorTop"] >= layout["headerBottom"], layout
            assert not layout["clipped"], layout
            assert layout["imagesValid"], layout
            assert len(layout["headings"]) == 5, layout
            assert page.locator('.method-card h3').all_text_contents() == ['1.競品分析', '2.問卷調查', '3.深入訪談']
            assert page.locator('.method-number').all_text_contents() == ['3', '47', '6']
            assert page.locator('.comparison-table thead th').count() == 5
            assert page.locator('.comparison-table tbody tr').count() == 4
            assert page.locator('.research-note,.research-takeaways,.journey-takeaway').count() == 0
            assert page.locator('.finding-card').count() == 2
            if width == 390:
                table = page.locator('.comparison-scroll')
                table.focus()
                page.keyboard.press('ArrowRight')
                page.wait_for_function("document.querySelector('.comparison-scroll').scrollLeft > 0")
                table.evaluate("el => el.scrollLeft = el.scrollWidth")
                assert table.evaluate("el => el.scrollLeft > 0")
                table.evaluate("el => el.scrollLeft = 0")
            if width in (390, 1440):
                page.locator('#research').evaluate("el => window.scrollTo(0, el.offsetTop - document.querySelector('.site-header').offsetHeight)")
                page.screenshot(path=str(args.output / f"{width}-research-viewport.png"))
                for panel in ("methods", "competition", "opportunities", "findings", "journey"):
                    page.locator(f'.research-{panel}').screenshot(
                        path=str(args.output / f"{width}-{panel}.png"),
                        style=".site-header { visibility: hidden; }",
                    )
            # Native history and homepage navigation remain intact.
            page.locator('.chapter-list a[href="#problem"]').click()
            expect(page.locator('.chapter-list a[href="#problem"]')).to_have_attribute('aria-current', 'location')
            page.go_back()
            expect(page.locator('.chapter-list a[href="#research"]')).to_have_attribute('aria-current', 'location')
            page.go_forward()
            expect(page.locator('.chapter-list a[href="#problem"]')).to_have_attribute('aria-current', 'location')
            results.append({"width": width, "status": "passed", **layout})
        page.set_viewport_size({"width": 390, "height": 844})
        page.emulate_media(reduced_motion="reduce")
        page.goto(args.url + '/#research', wait_until="networkidle")
        expect(page.locator('.chapter-list a[href="#research"]')).to_have_attribute('aria-current', 'location')
        # Desktop at 200% zoom has the CSS viewport of a 720px-wide screen.
        page.set_viewport_size({"width": 720, "height": 450})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        characters = set(page.locator('#research').inner_text())
        assets = Path(__file__).resolve().parents[1] / 'public' / 'assets'
        for weight in (400, 500, 700):
            with TTFont(assets / f'chiron-research-{weight}.ttf') as font:
                cmap = font.getBestCmap()
                missing = [char for char in characters if not char.isspace() and ord(char) not in cmap]
                assert not missing, {"weight": weight, "missing": missing}
                font_coverage.append({"weight": weight, "missingGlyphs": 0})
        browser.close()
    assert not errors, errors
    report = {"browser": args.channel, "results": results, "fontCoverage": font_coverage, "errors": errors}
    (args.output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
