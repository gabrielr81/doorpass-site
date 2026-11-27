// DoorPass hero: rotate the venue behind the door (club, concert, members lounge, comedy, festival, game day).
// The club ships in the page; the other five load after the page is done, so they never slow the first paint.
// One venue per 10.5 s (three scan results), starting on a random venue. No rotation for reduced motion.
(() => {
  const art = document.querySelector('.hero-art');
  const box = document.querySelector('.venue');
  if (!art || !box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const PERIOD = 10500;
  function start() {
    const scenes = [...box.querySelectorAll('.venue-scene')];
    if (scenes.length < 2) return;
    const names = scenes.map((s) => s.dataset.venue);
    const signs = [...document.querySelectorAll('.vsign [data-venue]')];
    let i = Math.floor(Math.random() * names.length);
    const show = (n) => { for (const el of [...scenes, ...signs]) el.classList.toggle('is-on', el.dataset.venue === n); art.dataset.venue = n; };
    const next = () => show(names[(i = (i + 1) % names.length)]);
    show(names[i]);
    // Switch on the scan-result cycle, which runs on page time from load.
    const now = document.timeline ? document.timeline.currentTime : performance.now();
    setTimeout(() => { next(); setInterval(next, PERIOD); }, PERIOD - (now % PERIOD));
  }
  function load() {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = '/assets/hero/venues-v2.css';
    document.head.append(css);
    fetch('/assets/hero/venues-v2.html').then((r) => (r.ok ? r.text() : '')).then((svg) => {
      if (svg) box.insertAdjacentHTML('beforeend', svg);
      start();
    }).catch(() => {});
  }
  if (document.readyState === 'complete') load(); else addEventListener('load', load, { once: true });
})();
