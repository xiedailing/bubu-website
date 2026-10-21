"""Create chapter 05A–C font subsets from full Chiron GoRound TC font files."""
import re
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8').split('<section id="iteration"', 1)[1].split('<section id="demo"', 1)[0]
text = re.sub(r'<[^>]+>', '', html) + '05 / 設計迭代 A'
for weight, source in zip((400, 500, 700), sys.argv[1:], strict=True):
    font = TTFont(source)
    missing = set(map(ord, text)) - set(font.getBestCmap()) - {10, 13}
    assert not missing, f'Missing glyphs: {missing}'
    options = subset.Options()
    options.name_IDs = ['*']
    sub = subset.Subsetter(options=options)
    sub.populate(text=text)
    sub.subset(font)
    font.save(root / f'public/assets/chiron-iteration-{weight}.ttf')
    print(f'{weight}: all chapter characters covered')
