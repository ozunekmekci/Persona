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
  bar('matrixBar', 100 * strassen / classic);
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

bind(['chipStage'], () => {
  const stage = number('chipStage');
  const [title, description] = chipStages[stage - 1];
  show('chipStageLabel', `${stage} / ${chipStages.length}`);
  show('chipStageTitle', title);
  show('chipStageDesc', description);
  bar('chipStageBar', stage / chipStages.length * 100);
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

bind(['hypotheses', 'lab', 'verify'], () => {
  const hypotheses = number('hypotheses');
  const lab = number('lab');
  const verify = number('verify');
  const throughput = Math.min(hypotheses, lab, verify);
  show('hypothesesLabel', hypotheses);
  show('labLabel', lab);
  show('verifyLabel', verify);
  show('throughput', throughput);
  show('bottleneck', throughput === hypotheses ? 'Hipotez üretimi' : throughput === lab ? 'Deney kapasitesi' : 'Doğrulama');
  bar('throughputBar', throughput / Math.max(hypotheses, lab, verify) * 100);
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
