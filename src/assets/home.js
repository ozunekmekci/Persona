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
    { color: '#be8973', easing: t => t },
    { color: '#9e4930', easing: t => t * t * (3 - 2 * t) },
    { color: '#c16d51', easing: t => 1 - (1 - t) ** 3 },
  ];
  line(context, [[left, top], [left, bottom], [right, bottom]], '#bd9b87');
  for (const { color, easing } of curves) {
    const points = Array.from({ length: 61 }, (_, index) => {
      const t = index / 60;
      return [left + t * (right - left), bottom - easing(t) * (bottom - top)];
    });
    line(context, points, color, 1.45);
    dot(context, ...points[29], 2.45, color);
  }
  dot(context, left, bottom, 2.5, '#9e4930');
  dot(context, right, top, 2.5, '#9e4930');
}

function noteCover(context, width, height) {
  const noteWidth = Math.min(width * .29, height * .78);
  const noteHeight = height * .58;
  const notes = [
    { x: -.86, y: .04, angle: -.23, fill: '#cfbd90' },
    { x: .83, y: .025, angle: .18, fill: '#dacba6' },
    { x: 0, y: -.065, angle: -.04, fill: '#fcf7e9' },
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
  curve: { color: '#a4745e20', draw: curveCover },
  notes: { color: '#c1936522', draw: noteCover },
  shape: { color: '#6d807124', draw: (context, width, height) => pyramid(context, width, height, 6, { art: true }) },
  default: { color: '#a4745e20', draw: curveCover },
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
