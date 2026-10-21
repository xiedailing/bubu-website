const chapterLinks = [...document.querySelectorAll('.chapter-list a')];

function updateCurrentChapter() {
  const current = chapterLinks.find((link) => link.hash === location.hash)
    ?? chapterLinks[0];

  for (const link of chapterLinks) {
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

// Hide the header while scrolling down, show it when scrolling up or at the top.
const header = document.querySelector('.site-header');
let lastY = window.scrollY;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const delta = y - lastY;
  if (y <= 0) header.classList.remove('is-hidden');
  else if (delta > 4) header.classList.add('is-hidden');
  else if (delta < -4) header.classList.remove('is-hidden');
  lastY = y;
}, { passive: true });

window.addEventListener('hashchange', updateCurrentChapter);
updateCurrentChapter();
