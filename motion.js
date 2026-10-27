// Scroll-triggered entrances. Elements are armed here and revealed as they enter the viewport;
// with reduced motion or no IntersectionObserver nothing is armed, so all content stays visible.
const ITEMS = ['.moment-card', '.method-card', '.opportunity-card', '.finding-card', '.persona-card', '.journey-card',
  '.insight-card', '.strategy-card', '.feature-card', '.iteration-stat', '.iteration-screen', '.design-card', '.ui-card', '.demo-scenario'];
const STAGGER = 90;
const MAX_DELAY = 360;

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const order = new Map();
  const targets = [...document.querySelectorAll([...ITEMS, '.emotion-chart'].join(','))];
  targets.forEach((el, i) => {
    order.set(el, i);
    el.classList.add(el.matches('.emotion-chart') ? 'm-hook' : 'm-item');
  });

  const observer = new IntersectionObserver((entries) => {
    // Items that appear together are staggered in document order.
    const batch = entries.filter((e) => e.isIntersecting).sort((a, b) => order.get(a.target) - order.get(b.target));
    batch.forEach((entry, k) => {
      const el = entry.target;
      const delay = Math.min(k * STAGGER, MAX_DELAY);
      el.style.setProperty('--d', `${delay}ms`);
      el.classList.add('m-in');
      observer.unobserve(el);
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => observer.observe(el));

  // The design-page logo drops in with a soft squash-and-stretch, then bounce again on hover or tap.
  const logoObserver = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach(({ target }) => {
      target.classList.add('m-in', 'm-drop');
      logoObserver.unobserve(target);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.design .brand-logo img').forEach((logo) => {
    logo.classList.add('m-logo');
    logoObserver.observe(logo);
    // Entrance and bounce are separate classes, so finishing one never restarts the other.
    logo.addEventListener('animationend', () => logo.classList.remove('m-drop', 'm-bounce'));
    const bounce = () => {
      if (!logo.classList.contains('m-in') || logo.getAnimations().length) return;
      logo.classList.add('m-bounce');
    };
    logo.parentElement.addEventListener('pointerenter', bounce);
    logo.parentElement.addEventListener('click', bounce);
  });
}
