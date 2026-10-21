"""Create chapter 07 font subsets: pass full Chiron TC 400, 500, 700 paths."""
import re
import sys
from html import unescape
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8').split('<section id="results"', 1)[1].split('</section>', 1)[0]
text = unescape(re.sub(r'<[^>]+>', '', html))
for weight, source in zip((400, 500, 700), sys.argv[1:], strict=True):
    font = TTFont(source)
    missing = set(map(ord, text)) - set(font.getBestCmap()) - {9, 10, 13}
    assert not missing, f'Missing glyphs: {missing}'
    sub = subset.Subsetter()
    sub.populate(text=text)
    sub.subset(font)
    font.save(root / f'public/assets/chiron-results-{weight}.ttf')
    print(f'{weight}: all chapter characters covered')
