document.querySelectorAll('.row-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const collapsed = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!collapsed));
    button.closest('tr').classList.toggle('is-collapsed', collapsed);
  });
});
