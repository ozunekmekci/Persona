import { canvasSurface, line, dot } from './canvas.js';

const article = document.querySelector('.osai-article');
const element = id => article.querySelector('#' + id);
const number = id => element(id).valueAsNumber;
const format = (value, digits = 1) => value.toLocaleString('tr-TR', { maximumFractionDigits: digits });
const show = (id, value) => { element(id).textContent = value; };
const bar = (id, percent) => { element(id).style.width = percent + '%'; };

function bind(ids, update) {
  for (const id of ids) element(id).addEventListener('input', update);
  update();
}

function drawGrowth(doubling, exponent) {
  const svg = element('growthGraph');
  const left = 42;
  const right = 518;
  const top = 12;
  const bottom = 209;
  const max = Math.max(5, Math.ceil((20 / doubling) ** exponent));
  const x = year => left + (right - left) * year / 20;
  const y = value => bottom - (bottom - top) * value / max;
  const curves = [
    year => Math.log2(1 + year / doubling),
    year => year / doubling,
    year => (year / doubling) ** exponent,
  ];
  let markup = '';
  for (let step = 0; step <= 5; step++) {
    const value = step * max / 5;
    const row = y(value);
    markup += `<line class="chart-grid" x1="${left}" x2="${right}" y1="${row}" y2="${row}"/>`;
    markup += `<text x="${left - 7}" y="${row + 4}" font-size="10" text-anchor="end">${format(value)}</text>`;
  }
  for (let year = 0; year <= 20; year += 5) {
    markup += `<text x="${x(year)}" y="232" font-size="10" text-anchor="middle">${year} yıl</text>`;
  }
  for (const [index, curve] of curves.entries()) {
    const path = Array.from({ length: 101 }, (_, step) => {
      const year = step / 5;
      return `${step ? 'L' : 'M'}${x(year).toFixed(1)} ${y(curve(year)).toFixed(1)}`;
    });
    markup += `<path class="series-${index + 1}" d="${path.join(' ')}" fill="none" stroke-width="2.6"/>`;
  }
  svg.innerHTML = markup;
}

bind(['life'], () => {
  const life = number('life');
  show('lifeLabel', life + ' yıl');
  show('lifeSeconds', format(365 * 86400 * life / 13.8e9, 3) + ' sn');
});

bind(['addHealthy'], () => {
  const years = number('addHealthy');
  show('addHealthyLabel', years + ' yıl');
  show('haleNew', format(62.8 + years) + ' yıl');
  bar('healthyBar', Math.min(62.8 + years, 100));
});

bind(['double', 'pow'], () => {
  const doubling = number('double');
  const exponent = number('pow');
  show('doubleLabel', doubling + ' yıl');
  show('pLabel', format(exponent));
  show('expOut', format(2 ** (20 / doubling)) + '×');
  show('superOut', format(2 ** ((20 / doubling) ** exponent)) + '×');
  drawGrowth(doubling, exponent);
});

bind(['matrix'], () => {
  const steps = number('matrix');
  const size = 2 ** steps;
  const classic = 8 ** steps;
  const strassen = 7 ** steps;
  show('matrixLabel', `${size} × ${size}`);
  show('classicLabel', format(classic, 0));
  show('strassenLabel', format(strassen, 0));
  show('matrixSaving', '%' + format((1 - strassen / classic) * 100) + ' daha az skaler çarpma');
  element('matrixBar').style.setProperty('--amount', `${100 * strassen / classic}%`);
});

bind(['gpu', 'share'], () => {
  const gpu = number('gpu');
  const share = number('share');
  const shared = gpu * share / 100;
  show('gpuLabel', format(gpu, 0));
  show('shareLabel', '%' + share);
  show('gpuShared', format(shared, 0));
  show('gpuHours', format(shared * 8760 / 1e6) + ' M');
});

bind(['demand', 'save'], () => {
  const demand = number('demand');
  const savings = number('save');
  const energy = 485 * demand * (1 - savings / 100);
  show('demandLabel', format(demand) + '×');
  show('saveLabel', '%' + savings);
  show('energyOut', format(energy, 0) + ' TWh');
  bar('energyBar', Math.min(energy / 2000 * 100, 100));
});

const chipStages = [
  ['RTL / Verilog', 'Çipin mantıksal davranışının kaynak kodu. Tek başına fiziksel çipin yerleşimini açıklamaz.'],
  ['Sentez / netlist', 'Yosys gibi araçlarla üretilen mantık kapıları ve bağlantı listesi. Hücre kitaplığına bağlı olabilir.'],
  ['DEF yerleşim', 'Kapıların ve metal bağlantıların fiziksel yerleşim koordinatları.'],
  ['GDSII geometrisi', 'Üretimde kullanılacak katman şekilleri ve poligonlar. Fiziksel denetim için güçlü bir referans.'],
  ['PDK ve doğrulama', 'Süreç kısıtları, DRC kuralları, modeller ve tekrarlanabilir akış. Ticari fablarda çoğu kez kapalı.'],
  ['Üretim ve fiziksel denetim', 'MPW/fab üretimi, test kayıtları ve bağımsız silikon incelemesi. Kaynağın açıklığı tek başına güvenlik garantisi değildir.'],
];

const chipScene = article.querySelector('[data-chip-scene]');
const chipLayers = [...chipScene.querySelectorAll('.chip-layer')];
const chipView = article.querySelector('[data-chip-view]');
chipView.hidden = false;
chipView.addEventListener('click', () => {
  const topView = chipScene.classList.toggle('is-top-view');
  chipView.setAttribute('aria-pressed', topView);
});

bind(['chipStage'], () => {
  const stage = number('chipStage');
  const [title, description] = chipStages[stage - 1];
  show('chipStageLabel', `${stage} / ${chipStages.length}`);
  show('chipStageTitle', title);
  show('chipStageDesc', description);
  chipLayers.forEach((layer, index) => {
    layer.classList.toggle('is-active', index === stage - 1);
  });
});

bind(['mpwCost', 'mpwCount', 'mpwExtra'], () => {
  const fixed = number('mpwCost');
  const count = number('mpwCount');
  const extra = number('mpwExtra');
  const solo = fixed + extra;
  const shared = fixed / count + extra;
  show('mpwCostLabel', format(fixed, 0) + ' USD');
  show('mpwCountLabel', count + ' tasarım');
  show('mpwExtraLabel', format(extra, 0) + ' USD');
  show('mpwSolo', format(solo, 0) + ' $');
  show('mpwShare', format(shared, 0) + ' $');
  bar('mpwBar', shared / solo * 100);
});

const capacityLabels = { hypotheses: 'Hipotez üretimi', lab: 'Deney kapasitesi', verify: 'Doğrulama' };
const capacityRows = [...element('scienceThroughput').children];
bind(Object.keys(capacityLabels), () => {
  const values = capacityRows.map(row => number(row.dataset.stage));
  const throughput = Math.min(...values);
  const max = Math.max(...values);
  const bottlenecks = [];
  for (const [index, row] of capacityRows.entries()) {
    const stage = row.dataset.stage;
    const value = values[index];
    show(stage + 'Label', value);
    row.querySelector('strong').textContent = value;
    row.style.setProperty('--amount', `${100 * value / max}%`);
    row.classList.toggle('is-bottleneck', value === throughput);
    if (value === throughput) bottlenecks.push(capacityLabels[stage]);
  }
  show('throughput', throughput);
  show('bottleneck', bottlenecks.join(' / '));
});

bind(['teams', 'teamHours', 'infrastructure', 'reclaim'], () => {
  const teams = number('teams');
  const hours = number('teamHours');
  const infrastructure = number('infrastructure');
  const reclaim = number('reclaim');
  const saved = teams * hours * (infrastructure / 100) * (reclaim / 100);
  show('teamsLabel', teams);
  show('teamHoursLabel', format(hours, 0) + ' saat');
  show('infrastructureLabel', '%' + infrastructure);
  show('reclaimLabel', '%' + reclaim);
  show('savedHours', format(saved, 0));
  show('savedYears', format(saved / 2000));
  bar('savedBar', infrastructure * reclaim / 100);
});

if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('osai-entered');
      observer.unobserve(entry.target);
    }
  }, { threshold: .18 });
  for (const figure of article.querySelectorAll('.osai-visual')) observer.observe(figure);
}

const transitCanvas = element('transitScene');
const transitSlider = element('transitTime');
const transitButton = element('transitPlay');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const transitSurface = canvasSurface(transitCanvas);
const planetRatio = .22;
const duration = 4800;
let transitFrame = 0;
let transitElapsed = 0;

function obscuredLight(time) {
  const distance = Math.abs(time - .5) / .15;
  const radiusSquared = planetRatio ** 2;
  if (distance >= 1 + planetRatio) return 0;
  if (distance <= 1 - planetRatio) return radiusSquared;
  const starAngle = Math.acos((distance ** 2 + 1 - radiusSquared) / (2 * distance));
  const planetAngle = Math.acos((distance ** 2 + radiusSquared - 1) / (2 * distance * planetRatio));
  const triangle = distance * Math.sin(starAngle);
  return (starAngle + radiusSquared * planetAngle - triangle) / Math.PI;
}

function drawTransit() {
  const surface = transitSurface();
  if (!surface) return;
  const { context, width, height } = surface;
  const time = number('transitTime') / 100;
  const left = 32;
  const right = width - 25;
  const centerX = (left + right) / 2;
  const centerY = height * .335;
  const radius = (right - left) * .15;
  const skyRadius = radius * .22;
  const gridTop = height * .68;
  const gridBottom = height - 24;
  const x = value => left + value * (right - left);
  const y = value => gridTop + obscuredLight(value) / planetRatio ** 2 * (gridBottom - gridTop - 7);

  for (let index = 0; index < 28; index++) {
    const starX = ((index * 149 + 39) % 311) / 311 * width;
    const starY = ((index * 61 + 17) % 137) / 137 * (gridTop - 15) + 6;
    dot(context, starX, starY, index % 6 === 0 ? 1.3 : .62, '#c8d9dd65');
  }

  context.setLineDash([3, 5]);
  line(context, [[left, centerY], [right, centerY]], '#78918b80');
  context.setLineDash([]);

  const glow = context.createRadialGradient(centerX, centerY, radius * .55, centerX, centerY, radius * 1.55);
  glow.addColorStop(0, '#e1ae6c52');
  glow.addColorStop(1, '#e1ae6c00');
  dot(context, centerX, centerY, radius * 1.55, glow);
  const star = context.createRadialGradient(centerX - radius * .27, centerY - radius * .34, 1, centerX, centerY, radius);
  star.addColorStop(0, '#fff1bf');
  star.addColorStop(.72, '#e9b976');
  star.addColorStop(1, '#d08852');
  dot(context, centerX, centerY, radius, star);
  dot(context, x(time), centerY, skyRadius + .9, '#d0cbbc');
  dot(context, x(time), centerY, skyRadius, '#1d2925');

  const samples = Array.from({ length: 101 }, (_, index) => index / 100);
  line(context, [[left, gridTop], [left, gridBottom], [right, gridBottom]], '#8b9e958c');
  line(context, samples.map(value => [x(value), y(value)]), '#edbd86', 2);
  line(context, [[x(time), gridTop], [x(time), gridBottom]], '#d6e5dc5c');
  dot(context, x(time), y(time), 3.5, '#fff2c9');

  context.fillStyle = '#d8dfd5';
  context.font = '12px Manrope, sans-serif';
  context.fillText('Göreli ışık', left, gridTop - 9);
  context.textAlign = 'right';
  context.fillText('Zaman', right, height - 7);
  context.textAlign = 'left';
}

function describeTransit() {
  const time = number('transitTime') / 100;
  const decrease = obscuredLight(time) * 100;
  const message = decrease < .01
    ? 'Gezegen yıldızın önünde değil. Işık başlangıç düzeyinde.'
    : 'Gezegen yıldızın önünde. Bu modelde görünen ışık %' + format(decrease, 2) + ' azalıyor.';
  show('transitStatus', message);
  transitSlider.setAttribute('aria-valuetext', '%' + number('transitTime') + ' · ' + message);
}

function pauseTransit(label) {
  cancelAnimationFrame(transitFrame);
  transitFrame = 0;
  transitButton.textContent = label;
  describeTransit();
}

if (transitCanvas.getContext('2d')) {
  transitCanvas.hidden = false;
  transitButton.hidden = false;
  transitSlider.closest('.transit-scrub').hidden = false;
  new ResizeObserver(drawTransit).observe(transitCanvas);
  transitSlider.addEventListener('input', () => {
    transitElapsed = duration * number('transitTime') / 100;
    pauseTransit('Geçişi oynat');
    drawTransit();
  });

  transitButton.addEventListener('click', () => {
    if (transitFrame) {
      pauseTransit('Geçişi sürdür');
      return;
    }
    if (motionPreference.matches) {
      transitSlider.value = 50;
      drawTransit();
      describeTransit();
      return;
    }
    if (transitElapsed >= duration) transitElapsed = 0;
    const initialElapsed = transitElapsed;
    let start;
    const update = now => {
      start ??= now;
      transitElapsed = Math.min(duration, initialElapsed + now - start);
      transitSlider.value = Math.round(100 * transitElapsed / duration);
      drawTransit();
      if (transitElapsed === duration) pauseTransit('Yeniden oynat');
      else transitFrame = requestAnimationFrame(update);
    };
    transitButton.textContent = 'Duraklat';
    transitFrame = requestAnimationFrame(update);
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches && transitFrame) pauseTransit('Geçişi oynat');
  });
  describeTransit();
}

function revealLinkedModel() {
  const anchor = document.getElementById(location.hash.slice(1));
  let details = anchor?.closest('.osai-article details');
  let opened = false;
  while (details) {
    opened ||= !details.open;
    details.open = true;
    details = details.parentElement.closest('.osai-article details');
  }
  if (opened) anchor.scrollIntoView();
}
window.addEventListener('hashchange', revealLinkedModel);
revealLinkedModel();
