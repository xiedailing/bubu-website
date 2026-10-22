const imageDialog = document.querySelector('.image-dialog');
const dialogTitle = imageDialog.querySelector('#image-dialog-title');
const viewer = imageDialog.querySelector('.image-dialog-viewer');
const stage = imageDialog.querySelector('.image-dialog-stage');
const nav = imageDialog.querySelector('.image-dialog-nav');
const navPrev = imageDialog.querySelector('[data-nav="prev"]');
const navNext = imageDialog.querySelector('[data-nav="next"]');
const navCount = imageDialog.querySelector('.image-dialog-count');
const zoomIn = imageDialog.querySelector('[data-zoom="in"]');
const zoomOut = imageDialog.querySelector('[data-zoom="out"]');
const zoomLevel = imageDialog.querySelector('.image-dialog-level');
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];
let zoomIndex = 0;
// Flow previews step through one flow; iteration previews open the whole old/new comparison.
let steps = [];
let stepIndex = 0;
let mode = 'single';

function createFigure({ image, caption, label, current }) {
  const figure = document.createElement('figure');
  figure.className = 'image-dialog-figure';
  const img = document.createElement('img');
  img.className = 'image-dialog-content';
  img.src = image;
  img.alt = caption;
  figure.append(img);
  if (label) {
    const figcaption = document.createElement('figcaption');
    const tag = document.createElement('span');
    tag.className = `image-dialog-tag${current ? ' is-current' : ''}`;
    tag.textContent = label;
    const detail = document.createElement('span');
    detail.textContent = caption.includes('：') ? caption.split('：').slice(1).join('：') : caption;
    figcaption.append(tag, detail);
    figure.append(figcaption);
  }
  return figure;
}

// Scale 1 fits every image inside the viewer; larger steps scroll within it.
function fitImages() {
  const images = [...stage.querySelectorAll('img')];
  const loaded = images.filter((img) => img.naturalWidth);
  if (!loaded.length) return;
  const style = getComputedStyle(viewer);
  const gap = parseFloat(getComputedStyle(stage).columnGap) || 0;
  const captionH = Math.max(0, ...[...stage.querySelectorAll('figcaption')].map((el) => el.offsetHeight + 8));
  const availW = viewer.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - gap * (images.length - 1);
  const availH = viewer.clientHeight - parseFloat(style.paddingBottom) - captionH;
  // Show every image at the same height, even when the source files differ in resolution.
  const height = Math.min(availH, ...loaded.map((img) => img.naturalHeight), ...loaded.map((img) => (availW / images.length) * (img.naturalHeight / img.naturalWidth)));
  for (const img of loaded) img.style.width = `${height * (img.naturalWidth / img.naturalHeight) * ZOOM_STEPS[zoomIndex]}px`;
}

function applyZoom() {
  // Captions wrap to the image width, so measure again once widths are set.
  fitImages();
  fitImages();
  zoomLevel.textContent = `${Math.round(ZOOM_STEPS[zoomIndex] * 100)}%`;
  zoomOut.disabled = zoomIndex === 0;
  zoomIn.disabled = zoomIndex === ZOOM_STEPS.length - 1;
}

function setZoom(index) {
  zoomIndex = Math.min(Math.max(index, 0), ZOOM_STEPS.length - 1);
  applyZoom();
  if (zoomIndex === 0) viewer.scrollTo(0, 0);
}

function render(figures, title) {
  zoomIndex = 0;
  dialogTitle.textContent = title;
  stage.replaceChildren(...figures);
  viewer.scrollTo(0, 0);
  for (const img of stage.querySelectorAll('img')) img.addEventListener('load', applyZoom);
  applyZoom();
}

function showStep(index) {
  stepIndex = Math.min(Math.max(index, 0), steps.length - 1);
  const step = steps[stepIndex];
  render([createFigure(step)], step.caption);
  navCount.textContent = `${stepIndex + 1} / ${steps.length}`;
  navPrev.disabled = stepIndex === 0;
  navNext.disabled = stepIndex === steps.length - 1;
}

function readPreview(button) {
  const tag = button.querySelector('.iteration-version');
  return {
    image: button.dataset.image,
    caption: button.dataset.caption,
    label: tag?.textContent.trim() ?? '',
    current: tag?.classList.contains('iteration-current') ?? false,
  };
}

function openPreview(button) {
  const comparison = button.closest('.iteration-comparison');
  if (comparison) {
    mode = 'compare';
    nav.hidden = true;
    const items = [...comparison.querySelectorAll('.flow-preview')].map(readPreview);
    render(items.map(createFigure), comparison.getAttribute('aria-label') ?? '');
  } else {
    mode = 'single';
    steps = [...button.closest('.flow-steps').querySelectorAll('.flow-preview')].map(readPreview);
    nav.hidden = steps.length < 2;
    showStep(steps.findIndex((step) => step.image === button.dataset.image));
  }
  imageDialog.showModal();
  applyZoom();
}

for (const preview of document.querySelectorAll('.flow-preview')) {
  preview.addEventListener('click', () => openPreview(preview));
}

zoomIn.addEventListener('click', () => setZoom(zoomIndex + 1));
zoomOut.addEventListener('click', () => setZoom(zoomIndex - 1));
navPrev.addEventListener('click', () => showStep(stepIndex - 1));
navNext.addEventListener('click', () => showStep(stepIndex + 1));
window.addEventListener('resize', () => { if (imageDialog.open) applyZoom(); });
imageDialog.addEventListener('keydown', (event) => {
  if (mode !== 'single' || nav.hidden) return;
  if (event.key === 'ArrowLeft') showStep(stepIndex - 1);
  else if (event.key === 'ArrowRight') showStep(stepIndex + 1);
});

imageDialog.querySelector('.image-dialog-close').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', (event) => {
  if (event.target !== imageDialog) return;
  const rect = imageDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    imageDialog.close();
  }
});
imageDialog.addEventListener('close', () => {
  // A queued close event can arrive after another preview has already opened.
  if (!imageDialog.open) stage.replaceChildren();
});
