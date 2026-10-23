const chapterLinks = [...document.querySelectorAll('.chapter-list a')];
const header = document.querySelector('.site-header');
const chapters = chapterLinks.map((link) => document.querySelector(link.hash));
let scheduled = false;

function updateCurrentChapter() {
  // The chapter crossing the line below the persistent header is current.
  const boundary = header.getBoundingClientRect().bottom + 32;
  let current = 0;
  chapters.forEach((chapter, index) => {
    if (chapter.getBoundingClientRect().top <= boundary) current = index;
  });
  // A short final chapter can never reach the line; at the page end it is current.
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = chapters.length - 1;
  chapterLinks.forEach((link, index) => {
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scheduled = false;
}
function scheduleUpdate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateCurrentChapter);
}
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('hashchange', scheduleUpdate);
window.addEventListener('pageshow', scheduleUpdate);
window.addEventListener('load', scheduleUpdate);
document.fonts.ready.then(scheduleUpdate);
updateCurrentChapter();
