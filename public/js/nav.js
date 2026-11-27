(() => {
  const button = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!button || !nav) return;
  const mq = window.matchMedia('(max-width: 52rem)');

  function setOpen(open) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
  }
  function close(focusButton) {
    setOpen(false);
    if (focusButton) button.focus();
  }

  button.addEventListener('click', () => {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
    e.preventDefault();
    close(true);
  });
  document.addEventListener('click', (e) => {
    if (button.getAttribute('aria-expanded') !== 'true') return;
    if (button.contains(e.target) || nav.contains(e.target)) return;
    close(false);
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) close(false);
  });
  mq.addEventListener('change', () => { if (!mq.matches) close(false); });
})();
