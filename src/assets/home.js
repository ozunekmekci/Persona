import { canvasSurface, dot, line, pyramid } from './canvas.js';

const filterGroup = document.querySelector('.filters');
if (filterGroup) {
  const buttons = [...filterGroup.querySelectorAll('button')];
  const cards = [...document.querySelectorAll('.post-card')];
  const result = document.querySelector('[data-filter-result]');
  filterGroup.hidden = false;

  for (const button of buttons) button.addEventListener('click', () => {
    for (const option of buttons) option.setAttribute('aria-pressed', option === button);
    let visible = 0;
    for (const card of cards) {
      card.hidden = !!button.dataset.filter && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) visible++;
    }
    result.textContent = `${visible} yazı gösteriliyor.`;
  });
}

function graphPaper(context, width, height, size, color) {
  context.beginPath();
  for (let x = width / 2 % size; x < width; x += size) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = height / 2 % size; y < height; y += size) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.lineWidth = 1;
  context.strokeStyle = color;
  context.stroke();
}

function curveCover(context, width, height) {
  const left = width * .17;
  const right = width * .83;
  const bottom = height * .77;
  const top = height * .23;
  const curves = [
    { color: '#8193ec', easing: t => t },
    { color: '#2846cc', easing: t => t * t * (3 - 2 * t) },
    { color: '#5c73d9', easing: t => 1 - (1 - t) ** 3 },
  ];
  line(context, [[left, top], [left, bottom], [right, bottom]], '#9ca9d7');
  for (const { color, easing } of curves) {
    const points = Array.from({ length: 61 }, (_, index) => {
      const t = index / 60;
      return [left + t * (right - left), bottom - easing(t) * (bottom - top)];
    });
    line(context, points, color, 1.45);
    dot(context, ...points[29], 2.45, color);
  }
  dot(context, left, bottom, 2.5, '#2846cc');
  dot(context, right, top, 2.5, '#2846cc');
}

function noteCover(context, width, height) {
  const noteWidth = Math.min(width * .29, height * .78);
  const noteHeight = height * .58;
  const notes = [
    { x: -.86, y: .04, angle: -.23, fill: '#eabf95' },
    { x: .83, y: .025, angle: .18, fill: '#f1cfac' },
    { x: 0, y: -.065, angle: -.04, fill: '#fff7e9' },
  ];
  for (const { x, y, angle, fill } of notes) {
    context.save();
    context.translate(width * .5 + x * noteWidth, height * (.5 + y));
    context.rotate(angle);
    context.beginPath();
    context.roundRect(-noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight, 3);
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = '#b67b52';
    context.lineWidth = .8;
    context.stroke();
    for (const [index, length] of [.47, .69, .6, .37].entries()) {
      const top = noteHeight * (-.29 + index * .17);
      line(context, [[-noteWidth * .35, top], [noteWidth * (length - .35), top]], index === 0 ? '#8b5230' : '#bd8b65', index === 0 ? 1.5 : 1);
    }
    context.restore();
  }
}

const covers = {
  curve: { color: '#7089d918', draw: curveCover },
  notes: { color: '#c1936522', draw: noteCover },
  shape: { color: '#61908d25', draw: (context, width, height) => pyramid(context, width, height, 6, true) },
  default: { color: '#8479ba24', draw: curveCover },
};
for (const canvas of document.querySelectorAll('[data-cover]')) {
  const getSurface = canvasSurface(canvas);
  const { color, draw } = covers[canvas.dataset.cover];
  const observer = new ResizeObserver(() => {
    const surface = getSurface();
    if (!surface) return;
    const { context, width, height } = surface;
    graphPaper(context, width, height, 16, color);
    draw(context, width, height);
  });
  observer.observe(canvas);
}

function orbitMesh() {
  const tau = Math.PI * 2;
  const steps = 72;
  const rings = 20;
  return Array.from({ length: steps }, (_, u) => {
    const turn = u / steps * tau;
    const radius = 1.17 + .10 * Math.cos(3 * turn);
    const thickness = .36 + .07 * Math.sin(2 * turn - .5);
    return Array.from({ length: rings }, (_, v) => {
      const phase = v / rings * tau + turn * 2;
      const distance = radius + thickness * Math.cos(phase);
      return [
        Math.cos(turn) * distance,
        Math.sin(turn) * distance,
        thickness * .91 * Math.sin(phase) + .16 * Math.sin(3 * turn),
      ];
    });
  });
}

const orbit = document.querySelector('[data-orbit]');
if (orbit?.getContext('2d')) {
  const mesh = orbitMesh();
  const getSurface = canvasSurface(orbit);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('[data-orbit-toggle]');
  let paused = reduced.matches;
  let visible = false;
  let pitch = .87;
  let yaw = -.35;
  let frame = 0;
  let previousTime = 0;
  let pointer = null;

  function draw() {
    const surface = getSurface();
    if (!surface) return;
    const { context, width, height } = surface;
    const centerX = width * .5;
    const centerY = height * .439;
    const size = Math.min(width, height * 1.42) / 4.58;
    const sinX = Math.sin(pitch);
    const cosX = Math.cos(pitch);
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    const slant = -.24;
    const cosZ = Math.cos(slant);
    const sinZ = Math.sin(slant);

    context.beginPath();
    context.ellipse(centerX, centerY, size * 1.83, size * 1.36, slant, 0, Math.PI * 2);
    context.lineWidth = 1;
    context.strokeStyle = '#d5e2ff3d';
    context.setLineDash([2, 6]);
    context.stroke();
    context.setLineDash([]);
    line(context, [[width * .105, centerY], [width * .895, centerY]], '#dbe4ff39');
    line(context, [[centerX, height * .125], [centerX, height * .805]], '#dbe4ff39');

    const projected = mesh.map(ring => ring.map(([x, y, z]) => {
      const ry = y * cosX - z * sinX;
      const rz = y * sinX + z * cosX;
      const rx = x * cosY + rz * sinY;
      const depth = -x * sinY + rz * cosY;
      const zoom = 4.9 / (4.9 - depth);
      return [
        centerX + (rx * cosZ - ry * sinZ) * size * zoom,
        centerY + (rx * sinZ + ry * cosZ) * size * zoom,
        depth,
      ];
    }));

    const ringSize = projected[0].length;
    const depthBands = Array.from({ length: 12 }, () => [[], []]);
    function addSegment(start, end, kind) {
      const depth = (start[2] + end[2]) / 2;
      const band = Math.max(0, Math.min(11, Math.floor((depth + 1.7) * 3.5)));
      depthBands[band][kind].push([start, end]);
    }
    for (const [i, ring] of projected.entries()) {
      const next = projected[(i + 1) % projected.length];
      for (const [j, point] of ring.entries()) {
        addSegment(point, next[j], 1);
        if (i % 2 === 0) addSegment(point, ring[(j + 1) % ringSize], 0);
      }
    }
    for (const [band, groups] of depthBands.entries()) {
      const opacity = .23 + band * .054;
      for (const [kind, segments] of groups.entries()) {
        context.beginPath();
        for (const [[x1, y1], [x2, y2]] of segments) {
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
        }
        context.strokeStyle = `rgba(${kind ? '223,234,255' : '155,199,255'},${opacity})`;
        context.lineWidth = kind ? 1 : .76;
        context.stroke();
      }
    }
    for (const x of [width * .12, width * .88]) {
      line(context, [[x - 4, centerY], [x + 4, centerY]], '#e0e9ffad');
      line(context, [[x, centerY - 4], [x, centerY + 4]], '#e0e9ffad');
    }
  }

  function animate(time) {
    frame = 0;
    if (paused || !visible) return;
    const elapsed = previousTime ? Math.min(time - previousTime, 40) : 0;
    previousTime = time;
    if (!pointer) yaw += elapsed * .00023;
    draw();
    frame = requestAnimationFrame(animate);
  }

  function updateAnimation() {
    toggle.toggleAttribute('data-paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Animasyonu oynat' : 'Animasyonu durdur');
    previousTime = 0;
    cancelAnimationFrame(frame);
    frame = paused || !visible ? 0 : requestAnimationFrame(animate);
    draw();
  }

  orbit.dataset.ready = '';
  orbit.removeAttribute('aria-hidden');
  orbit.setAttribute('role', 'img');
  orbit.setAttribute('aria-label', 'Etkileşimli üç boyutlu form. Çevirmek için ok tuşlarını kullan.');
  orbit.tabIndex = 0;
  toggle.parentElement.hidden = false;
  toggle.addEventListener('click', () => {
    paused = !paused;
    updateAnimation();
  });
  reduced.addEventListener('change', event => {
    paused = event.matches;
    updateAnimation();
  });
  orbit.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    orbit.setPointerCapture(pointer.id);
    orbit.classList.add('is-dragging');
  });
  orbit.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer?.id) return;
    yaw += (event.clientX - pointer.x) * .01;
    pitch += (event.clientY - pointer.y) * .01;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!frame) draw();
  });
  orbit.addEventListener('lostpointercapture', event => {
    if (event.pointerId !== pointer?.id) return;
    pointer = null;
    orbit.classList.remove('is-dragging');
  });
  orbit.addEventListener('keydown', event => {
    const delta = { ArrowLeft: [-.14, 0], ArrowRight: [.14, 0], ArrowUp: [0, -.14], ArrowDown: [0, .14] }[event.key];
    if (!delta) return;
    event.preventDefault();
    yaw += delta[0];
    pitch += delta[1];
    if (!frame) draw();
  });
  new ResizeObserver(draw).observe(orbit);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateAnimation();
  }).observe(orbit);
  updateAnimation();
}
