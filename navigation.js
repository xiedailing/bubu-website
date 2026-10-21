const chapterLinks = [...document.querySelectorAll('.chapter-list a')];

function updateCurrentChapter() {
  const current = chapterLinks.find((link) => link.hash === location.hash)
    ?? chapterLinks[0];

  for (const link of chapterLinks) {
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

window.addEventListener('hashchange', updateCurrentChapter);
updateCurrentChapter();
