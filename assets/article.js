const progress = document.querySelector('.reading-progress span');
const prose = document.querySelector('.prose');
if (progress && prose) {
  const headings = [...document.querySelectorAll('.toc a')].map(link => ({
    link,
    heading: document.getElementById(link.hash.slice(1)),
  }));
  let waiting = false;
  function update() {
    waiting = false;
    const { top, height } = prose.getBoundingClientRect();
    const anchor = window.innerHeight * .4;
    const fraction = Math.max(0, Math.min(1, (anchor - top) / Math.max(height - anchor, 1)));
    progress.style.transform = `scaleX(${fraction})`;
    const current = headings.findLast(({ heading }) => heading.getBoundingClientRect().top <= 96);
    for (const item of headings) {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  }
  function schedule() {
    if (waiting) return;
    waiting = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(prose);
  update();
}

const print = document.querySelector('[data-print]');
if (print) {
  print.hidden = false;
  print.addEventListener('click', () => window.print());
}
