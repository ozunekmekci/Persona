import { canvasSurface, dot, line, pyramid } from './canvas.js';

function setActive(buttons, active) {
  for (const button of buttons) button.setAttribute('aria-pressed', button === active);
}

function wireCurve(fig) {
  const buttons = [...fig.querySelectorAll('[data-curve]')];
  const reference = fig.querySelector('[data-reference]');
  const selected = fig.querySelector('[data-selected]');
  const note = fig.querySelector('[data-curve-note]');
  const graph = fig.querySelector('canvas');
  const getSurface = canvasSurface(graph);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const curves = {
    linear: { easing: t => t, note: 'Hareket baştan sona sabit hızda.' },
    smooth: { easing: t => t * t * (3 - 2 * t), note: 'Başta ve sonda yavaş, ortada hızlı.' },
    sharp: { easing: t => 1 - (1 - t) ** 3, note: 'Hareket hızlı başlar ve giderek yavaşlar.' },
  };
  let curve = curves.smooth;
  let frame = 0;

  function draw() {
    const surface = getSurface();
    if (!surface) return;
    const { context, width, height } = surface;
    const left = 36;
    const right = width - 17;
    const top = 15;
    const bottom = height - 28;
    for (let step = 0; step <= 4; step++) {
      const x = left + (right - left) * step / 4;
      const y = top + (bottom - top) * step / 4;
      line(context, [[x, top], [x, bottom]], '#ece4d7');
      line(context, [[left, y], [right, y]], '#ece4d7');
    }
    line(context, [[left, top], [left, bottom], [right, bottom]], '#a39c8e');
    line(context, [[left, bottom], [right, top]], '#908779', 1.2);
    const points = Array.from({ length: 81 }, (_, index) => {
      const t = index / 80;
      return [left + (right - left) * t, bottom - (bottom - top) * curve.easing(t)];
    });
    line(context, points, '#ab4a32', 2.3);
    dot(context, ...points[0], 2.7, '#ab4a32');
    dot(context, ...points.at(-1), 2.7, '#ab4a32');
    context.fillStyle = '#686455';
    context.font = '12px Manrope, sans-serif';
    context.fillText('Yol', 7, top + 8);
    context.fillText('Zaman', right - 37, height - 8);
  }

  function renderPositions(t) {
    reference.style.setProperty('--position', `${t * 100}%`);
    selected.style.setProperty('--position', `${curve.easing(t) * 100}%`);
  }

  function replay() {
    cancelAnimationFrame(frame);
    if (reduced.matches) {
      renderPositions(.45);
      return;
    }
    let start;
    function update(time) {
      start ??= time;
      const t = Math.min((time - start) / 1600, 1);
      renderPositions(t);
      if (t < 1) frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
  }

  for (const button of buttons) button.addEventListener('click', () => {
    setActive(buttons, button);
    curve = curves[button.dataset.curve];
    note.textContent = curve.note;
    graph.setAttribute('aria-label', curve.note);
    draw();
    replay();
  });
  fig.querySelector('[data-replay]').addEventListener('click', replay);
  reduced.addEventListener('change', event => {
    if (!event.matches) return;
    cancelAnimationFrame(frame);
    renderPositions(.45);
  });
  new ResizeObserver(draw).observe(graph);
}

function wireNotes(fig) {
  const buttons = [...fig.querySelectorAll('[data-note]')];
  const panels = [...fig.querySelectorAll('[data-note-panel]')];
  for (const button of buttons) button.addEventListener('click', () => {
    setActive(buttons, button);
    for (const panel of panels) panel.hidden = panel.dataset.notePanel !== button.dataset.note;
  });
}

function wireShape(fig) {
  const input = fig.querySelector('input');
  const sidesOutput = fig.querySelector('[data-sides]');
  const faces = fig.querySelector('[data-faces]');
  const edges = fig.querySelector('[data-edges]');
  const vertices = fig.querySelector('[data-vertices]');
  const graph = fig.querySelector('canvas');
  const getSurface = canvasSurface(graph);
  let rotation = 0;
  let drag = null;
  function draw() {
    const surface = getSurface();
    if (!surface) return;
    const { context, width, height } = surface;
    pyramid(context, width, height, input.valueAsNumber, { rotation });
  }
  function update() {
    const sides = input.valueAsNumber;
    sidesOutput.value = sides;
    faces.textContent = sides + 1;
    edges.textContent = 2 * sides;
    vertices.textContent = sides + 1;
    graph.setAttribute('aria-label', `Tabanı ${sides} kenarlı piramit. Döndürmek için sağ ve sol ok tuşlarını kullan.`);
    draw();
  }
  input.addEventListener('input', update);
  graph.tabIndex = 0;
  graph.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight');
  fig.querySelector('.shape-hint').hidden = false;
  graph.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    rotation += event.key === 'ArrowLeft' ? -.16 : .16;
    draw();
  });
  graph.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, rotation };
    graph.setPointerCapture(drag.id);
  });
  graph.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    rotation = drag.rotation + (event.clientX - drag.x) * .025;
    draw();
  });
  graph.addEventListener('lostpointercapture', event => {
    if (drag?.id === event.pointerId) drag = null;
  });
  new ResizeObserver(draw).observe(graph);
  update();
}

const experiments = { curve: wireCurve, notes: wireNotes, shape: wireShape };
for (const figure of document.querySelectorAll('[data-experiment]')) {
  experiments[figure.dataset.experiment](figure);
}
