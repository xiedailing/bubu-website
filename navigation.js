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

// Page jump: every direct child of a chapter is one "page"; the demo section is a page itself.
const pages = [...document.querySelectorAll('main > section')].flatMap((section) => (section.matches('.demo') ? [section] : [...section.children]));
const jumpPrev = document.querySelector('[data-jump="prev"]');
const jumpNext = document.querySelector('[data-jump="next"]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function viewArea() {
  const top = header.getBoundingClientRect().height;
  return { top, height: window.innerHeight - top };
}
function pageBox(page) {
  const rect = page.getBoundingClientRect();
  return { top: rect.top + window.scrollY, height: rect.height };
}
// Short pages are centred in the area under the header; taller pages start at its top edge.
// Clamped to the real scroll range so the first and last pages never need a second press.
function alignedScroll(page) {
  const area = viewArea();
  const box = pageBox(page);
  const offset = box.height < area.height ? (area.height - box.height) / 2 : 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.min(Math.max(0, Math.round(box.top - area.top - offset)), Math.max(0, max));
}
function currentPage() {
  const area = viewArea();
  const probe = window.scrollY + area.top + area.height / 2;
  let index = 0;
  pages.forEach((page, i) => { if (pageBox(page).top <= probe) index = i; });
  return index;
}
function goTo(top) {
  window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}
// One press always lands on the next or previous page, never on a half step.
function jump(direction) {
  const current = currentPage();
  const y = window.scrollY;
  const home = alignedScroll(pages[current]);
  // Scrolled off a page's own position (e.g. by hand): the first press snaps back to that page.
  const snap = direction > 0 ? home > y + 40 : home < y - 40;
  const index = Math.min(Math.max(snap ? current : current + direction, 0), pages.length - 1);
  goTo(alignedScroll(pages[index]));
}
function updateJump() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  jumpPrev.disabled = window.scrollY <= 40;
  jumpNext.disabled = window.scrollY >= max - 2;
}
jumpPrev.addEventListener('click', () => jump(-1));
jumpNext.addEventListener('click', () => jump(1));
window.addEventListener('scroll', updateJump, { passive: true });
window.addEventListener('resize', updateJump);
window.addEventListener('load', updateJump);
updateJump();
