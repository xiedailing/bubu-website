const imageDialog = document.querySelector('.image-dialog');
const dialogImage = imageDialog.querySelector('.image-dialog-content');
const dialogTitle = imageDialog.querySelector('#image-dialog-title');

for (const preview of document.querySelectorAll('.flow-preview')) {
  preview.addEventListener('click', () => {
    dialogImage.src = preview.dataset.image;
    dialogImage.alt = preview.dataset.caption;
    dialogTitle.textContent = preview.dataset.caption;
    imageDialog.showModal();
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
  if (!imageDialog.open) dialogImage.removeAttribute('src');
});
