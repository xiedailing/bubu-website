const imageDialog = document.querySelector('.image-dialog');
const dialogImage = imageDialog.querySelector('.image-dialog-content');
const dialogTitle = imageDialog.querySelector('#image-dialog-title');
const viewer = imageDialog.querySelector('.image-dialog-viewer');
const zoomIn = imageDialog.querySelector('[data-zoom="in"]');
const zoomOut = imageDialog.querySelector('[data-zoom="out"]');
const zoomLevel = imageDialog.querySelector('.image-dialog-level');
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];
let zoomIndex = 0;

// Scale 1 fits the whole image inside the viewer; larger steps scroll within it.
function applyZoom() {
  const { naturalWidth, naturalHeight } = dialogImage;
  if (naturalWidth) {
    const style = getComputedStyle(viewer);
    const availW = viewer.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const availH = viewer.clientHeight - parseFloat(style.paddingBottom);
    const fit = Math.min(availW / naturalWidth, availH / naturalHeight, 1);
    dialogImage.style.width = `${naturalWidth * fit * ZOOM_STEPS[zoomIndex]}px`;
  }
  zoomLevel.textContent = `${Math.round(ZOOM_STEPS[zoomIndex] * 100)}%`;
  zoomOut.disabled = zoomIndex === 0;
  zoomIn.disabled = zoomIndex === ZOOM_STEPS.length - 1;
}

function setZoom(index) {
  zoomIndex = Math.min(Math.max(index, 0), ZOOM_STEPS.length - 1);
  applyZoom();
  if (zoomIndex === 0) viewer.scrollTo(0, 0);
}

zoomIn.addEventListener('click', () => setZoom(zoomIndex + 1));
zoomOut.addEventListener('click', () => setZoom(zoomIndex - 1));
dialogImage.addEventListener('load', applyZoom);
window.addEventListener('resize', () => { if (imageDialog.open) applyZoom(); });

for (const preview of document.querySelectorAll('.flow-preview')) {
  preview.addEventListener('click', () => {
    dialogImage.src = preview.dataset.image;
    dialogImage.alt = preview.dataset.caption;
    dialogTitle.textContent = preview.dataset.caption;
    zoomIndex = 0;
    imageDialog.showModal();
    applyZoom();
  });
}

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
  if (!imageDialog.open) {
    dialogImage.removeAttribute('src');
    dialogImage.style.width = '';
  }
});
