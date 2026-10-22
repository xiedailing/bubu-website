"""Rebuild presentation subsets and verify coverage using full Chiron 400/500/700 fonts.

Usage:
  python scripts/subset-revision-fonts.py <400.ttf> <500.ttf> <700.ttf>   rebuild subsets
  python scripts/subset-revision-fonts.py --check                         report missing glyphs, no source fonts needed
Requires fonttools; full source fonts are kept outside the website.
Run --check after every text edit in index.html; rebuild when it reports missing characters.
"""
import re
import sys
import argparse
from html import unescape
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8')
sections = {'problem': 'chiron-goround-tc', 'research': 'chiron-research',
            'insights': 'chiron-insights', 'solution': 'chiron-solution',
            'iteration': 'chiron-iteration', 'demo': 'chiron-demo', 'design': 'chiron-design',
            'results': 'chiron-results'}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('sources', nargs='*')
parser.add_argument('--check', action='store_true')
parser.add_argument('--sections', nargs='+', choices=sections, default=list(sections))
sys.stdout.reconfigure(encoding="utf-8")
args = parser.parse_args()
if not args.check and len(args.sources) != 3:
    parser.error('provide three source fonts, or use --check')
def section_text(section):
    start = html.index(f'<section id="{section}"')
    end = html.find('<section id=', start + 1)
    content = html[start:end if end >= 0 else html.index('</main>', start)]
    # Homepage family also renders navigation and the image preview toolbar.
    if section == 'problem':
        content += html[:html.index('<main')] + html[html.index('<dialog'):]
    text = unescape(re.sub(r'<[^>]+>', '', content))
    return text + '；：／、＋−×<>0123456789% /'


if args.check:
    failed = False
    for section in args.sections:
        text = section_text(section)
        for weight in (400, 500, 700):
            with TTFont(root / f'public/assets/{sections[section]}-{weight}.ttf') as font:
                missing = sorted({c for c in text if not c.isspace() and ord(c) not in font.getBestCmap()})
            if missing:
                failed = True
                print(f'MISSING {section} {weight}: {"".join(missing)}')
    print('font coverage FAILED: rebuild subsets' if failed else 'font coverage OK')
    raise SystemExit(1 if failed else 0)

for weight, source in zip((400, 500, 700), args.sources, strict=True):
    for section in args.sections:
        prefix = sections[section]
        text = section_text(section)
        with TTFont(source) as font:
            missing = {c for c in text if not c.isspace() and ord(c) not in font.getBestCmap()}
            assert not missing, (section, weight, missing)
            sub = subset.Subsetter()
            sub.populate(text=text)
            sub.subset(font)
            font.save(root / f'public/assets/{prefix}-{weight}.ttf')
        with TTFont(root / f'public/assets/{prefix}-{weight}.ttf') as font:
            assert all(c.isspace() or ord(c) in font.getBestCmap() for c in text)
        print(f'{section} {weight}: missing glyphs = 0')
