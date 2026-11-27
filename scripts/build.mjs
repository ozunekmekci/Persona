import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt();
const profile = JSON.parse(await readFile('content/ozgecmis.json', 'utf8'));
const siteName = profile.ad || 'Kişisel Alan';
const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeZone: 'UTC' });
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const coverStyles = new Set(['curve', 'notes', 'shape']);
const titleSlug = title => title.toLocaleLowerCase('tr').normalize('NFD')
  .replace(/\p{M}/gu, '').replaceAll('ı', 'i').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const experiments = {
  curve: () => `
    <figure class="experiment" data-experiment="curve">
      <figcaption>Hareket eğrileri</figcaption>
      <div class="experiment-controls" role="group" aria-label="Hareket eğrisi">
        <button type="button" data-curve="linear" aria-pressed="false">Doğrusal</button>
        <button type="button" data-curve="smooth" aria-pressed="true">Yumuşak</button>
        <button type="button" data-curve="sharp" aria-pressed="false">Keskin</button>
      </div>
      <canvas class="experiment-graph" role="img" aria-label="Yumuşak eğride yol, başta ve sonda yavaş artar."></canvas>
      <div class="motion-lanes" aria-label="Hareket karşılaştırması">
        <div class="motion-lane"><span>Referans</span><div class="track"><i data-reference></i></div></div>
        <div class="motion-lane"><span>Seçilen</span><div class="track"><i data-selected></i></div></div>
      </div>
      <div class="experiment-bottom"><p data-curve-note aria-live="polite">Başta ve sonda yavaş, ortada hızlı.</p><button type="button" data-replay>Yeniden oynat</button></div>
    </figure>`,
  notes: () => `
    <figure class="experiment" data-experiment="notes">
      <figcaption>Notun üç hâli</figcaption>
      <div class="experiment-controls" role="group" aria-label="Notun aşaması">
        <button type="button" data-note="raw" aria-pressed="true">Ham not</button>
        <button type="button" data-note="groups" aria-pressed="false">Grupla</button>
        <button type="button" data-note="draft" aria-pressed="false">Taslak</button>
      </div>
      <div class="note-sample" aria-live="polite">
        <div data-note-panel="raw"><ul><li>Sabah kıyı sakin.</li><li>Akşam ışık değişiyor.</li><li>Aynı rota günün iki saatinde nasıl hissettiriyor?</li><li>Seslere ve mola verdiğim yere dikkat et.</li></ul></div>
        <div data-note-panel="groups" hidden><p><strong>Soru</strong><br>Aynı rota günün iki saatinde nasıl hissettiriyor?</p><p><strong>Gözlemler</strong><br>Sabah kıyı sakin. Akşam ışık değişiyor.</p><p><strong>Sonraki yürüyüş</strong><br>Sesleri dinle ve mola verdiğim yeri not et.</p></div>
        <div data-note-panel="draft" hidden><p><strong>Aynı rota, iki ayrı saat</strong></p><p>Sabah kıyı boyunca yürürken durup suyu dinledim. Akşam aynı noktada ışık değişmişti ve yürümeye devam ettim. Bir dahaki sefere seslerdeki farkı ve nerede durmak istediğimi not edeceğim.</p></div>
      </div>
    </figure>`,
  shape: index => `
    <figure class="experiment" data-experiment="shape">
      <figcaption>Çokgen tabanlı piramit</figcaption>
      <div class="range-control"><label for="sides-${index}">Taban kenarı</label><input id="sides-${index}" type="range" min="3" max="10" value="5"><output for="sides-${index}" data-sides>5</output></div>
      <canvas class="experiment-graph" role="img" aria-label="Beşgen tabanlı piramit çizimi"></canvas>
      <dl class="shape-stats" aria-live="polite"><div><dt>Yüz</dt><dd data-faces>6</dd></div><div><dt>Kenar</dt><dd data-edges>10</dd></div><div><dt>Köşe</dt><dd data-vertices>6</dd></div></dl>
    </figure>`,
};

function renderArticle(source) {
  const tokens = markdown.parse(source, {});
  const headings = [];
  const usedIds = new Set();
  for (const [index, token] of tokens.entries()) {
    if (token.type !== 'inline') continue;
    const previous = tokens[index - 1];
    if (previous?.type === 'heading_open') {
      const label = token.children.filter(child => ['text', 'code_inline', 'image'].includes(child.type))
        .map(child => child.content).join('');
      const base = titleSlug(label) || 'bolum';
      let id = base;
      let count = 2;
      while (usedIds.has(id)) id = `${base}-${count++}`;
      usedIds.add(id);
      previous.attrSet('id', id);
      if (previous.tag === 'h2') headings.push({ id, label });
    }
    const experiment = token.content.match(/^::: deney ([a-z]+)$/);
    if (previous?.type === 'paragraph_open' && experiment) {
      const render = Object.hasOwn(experiments, experiment[1]) && experiments[experiment[1]];
      if (!render) throw new Error(`Bilinmeyen deney: ${experiment[1]}`);
      previous.hidden = true;
      tokens[index + 1].hidden = true;
      token.type = 'html_block';
      token.content = render(index);
    }
  }
  return { headings, html: markdown.renderer.render(tokens, markdown.options, {}) };
}

async function readArticle(file) {
  const slug = file.slice(0, -3);
  const source = await readFile(`content/yazilar/${file}`, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!slugPattern.test(slug) || !match) throw new Error(`Yazı adı veya üst bilgisi geçersiz: ${file}`);
  const info = JSON.parse(match[1]);
  if (info.taslak) return null;
  if (!['baslik', 'ozet', 'tarih', 'kategori'].every(field => typeof info[field] === 'string' && info[field].trim())
      || !/^\d{4}-\d{2}-\d{2}$/.test(info.tarih) || !Number.isFinite(Date.parse(info.tarih))
      || new Date(info.tarih).toISOString().slice(0, 10) !== info.tarih) {
    throw new Error(`Eksik veya geçersiz yazı bilgisi: ${file}`);
  }
  const words = match[2].replace(/^::: deney [a-z]+$/gm, '').trim().split(/\s+/u).length;
  return { ...info, slug, minutes: Math.max(1, Math.ceil(words / 180)), ...renderArticle(match[2]) };
}

const posts = (await Promise.all((await readdir('content/yazilar'))
  .filter(file => file.endsWith('.md')).map(readArticle)))
  .filter(Boolean).sort((a, b) => b.tarih.localeCompare(a.tarih) || a.slug.localeCompare(b.slug));

function layout({ title, summary, page, body, scripts = [] }) {
  const fullTitle = title === siteName ? title : `${title} · ${siteName}`;
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${escape(summary)}">
  <meta name="theme-color" content="#fcfbf8">
  <title>${escape(fullTitle)}</title>
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="stylesheet" href="/assets/style.css">
  ${scripts.map(script => `<script type="module" src="/assets/${script}.js"></script>`).join('\n  ')}
</head>
<body data-page="${page}">
  <a class="skip" href="#icerik">İçeriğe geç</a>
  <header class="site-header">
    <div class="shell header-row">
      <a class="brand" href="/" ${page === 'home' ? 'aria-current="page"' : ''}><span class="brand-mark" aria-hidden="true"><i></i></span><span>${escape(siteName)}</span></a>
      <nav aria-label="Ana menü">
        <a href="/#yazilar" ${page === 'post' ? 'aria-current="true"' : ''}>Yazılar</a>
        <a href="/ozgecmis/" ${page === 'cv' ? 'aria-current="page"' : ''}>Özgeçmiş</a>
      </nav>
    </div>
  </header>
  ${body}
  <footer class="site-footer">
    <div class="shell footer-row"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true"><i></i></span><span>${escape(siteName)}</span></a><a href="/ozgecmis/">Özgeçmiş</a></div>
  </footer>
</body>
</html>`;
}

function meta(post) {
  return `<span>${post.ornek ? 'Örnek<span class="meta-dot" aria-hidden="true"></span>' : ''}<time datetime="${escape(post.tarih)}">${dateFormat.format(new Date(post.tarih))}</time><span class="meta-dot" aria-hidden="true"></span>${post.minutes} dk</span>`;
}

function card(post) {
  const cover = coverStyles.has(post.gorsel) ? post.gorsel : 'default';
  return `<article class="post-card" data-category="${escape(post.kategori)}">
    <a class="post-link" href="/yazilar/${post.slug}/">
      <div class="post-art art-${cover}"><canvas aria-hidden="true" data-cover="${cover}"></canvas></div>
      <div class="post-card-content">
        <span class="category">${escape(post.kategori)}</span>
        <h3>${escape(post.baslik)}</h3>
        <p>${escape(post.ozet)}</p>
        <div class="post-meta">${meta(post)}</div>
      </div>
    </a>
  </article>`;
}

const categories = [...new Set(posts.map(post => post.kategori))];
const summary = 'Yazılarımı, etkileşimli deneylerimi ve özgeçmişimi bir araya getirdiğim kişisel alan.';
const home = layout({
  title: siteName, summary, page: 'home', scripts: ['home'],
  body: `<main id="icerik" class="shell">
    <section class="hero" aria-labelledby="giris">
      <div class="hero-copy">
        ${profile.ad ? `<p class="hero-name">${escape(profile.ad)}${profile.unvan ? `<span> / </span>${escape(profile.unvan)}` : ''}</p>` : ''}
        <h1 id="giris">Düşünmek için <em>bir alan.</em></h1>
        <p>${summary}</p>
        <div class="hero-actions"><a class="button primary" href="#yazilar">Yazıları keşfet</a><a class="button secondary" href="/ozgecmis/">Özgeçmiş</a></div>
      </div>
      <figure class="hero-art">
        <canvas data-orbit aria-hidden="true"></canvas>
        <span class="art-corner top-left" aria-hidden="true"></span><span class="art-corner top-right" aria-hidden="true"></span>
        <span class="art-corner bottom-left" aria-hidden="true"></span><span class="art-corner bottom-right" aria-hidden="true"></span>
        <div class="art-controls" hidden><span>3B form · Sürükleyerek döndür</span><button type="button" class="art-toggle" aria-label="Animasyonu durdur" data-orbit-toggle><i aria-hidden="true"></i></button></div>
      </figure>
    </section>
    <section class="writing" id="yazilar" aria-labelledby="yazilar-baslik">
      <div class="section-heading">
        <div><h2 id="yazilar-baslik">Yazılar</h2><p>Notlar ve etkileşimli deneyler.</p></div>
        ${categories.length > 1 ? `<div class="filters" role="group" aria-label="Yazı kategorileri" hidden>
          <button type="button" aria-pressed="true" data-filter="">Tümü</button>
          ${categories.map(category => `<button type="button" aria-pressed="false" data-filter="${escape(category)}">${escape(category)}</button>`).join('')}
        </div>` : ''}
      </div>
      <div class="post-grid">${posts.map(card).join('')}</div>
      ${posts.length === 0 ? '<p>Henüz yazı eklenmedi.</p>' : ''}
      <p class="sr-only" data-filter-result aria-live="polite"></p>
    </section>
  </main>`,
});

function postPage(post) {
  return layout({
    title: post.baslik, summary: post.ozet, page: 'post', scripts: ['article', 'experiments'],
    body: `<div class="reading-progress" aria-hidden="true"><span></span></div><main id="icerik" class="shell inner-page">
      <a class="back-link" href="/#yazilar">Tüm yazılar</a>
      <header class="page-heading">
        <div class="post-meta"><span class="category">${escape(post.kategori)}</span>${meta(post)}</div>
        <h1>${escape(post.baslik)}</h1>
        <p>${escape(post.ozet)}</p>
      </header>
      <div class="reading-layout">
        ${post.headings.length ? `<aside class="toc"><nav aria-label="İçindekiler"><p>İçindekiler</p><ol>${post.headings.map(heading => `<li><a href="#${heading.id}">${escape(heading.label)}</a></li>`).join('')}</ol></nav></aside>` : ''}
        <article class="prose">${post.html}</article>
      </div>
    </main>`,
  });
}

function timeline(title, entries) {
  if (!entries.length) return '';
  return `<section class="cv-section"><h2>${title}</h2><div class="cv-entries">${entries.map(entry => `
    <div class="cv-entry"><div><h3>${escape(entry.baslik)}</h3><p>${escape(entry.kurum)}</p></div>
    <p class="cv-date">${escape(entry.tarih)}</p>${entry.aciklama ? `<p class="cv-detail">${escape(entry.aciklama)}</p>` : ''}</div>`).join('')}</div></section>`;
}
const profileLinks = profile.baglantilar.filter(link => /^(https?:\/\/|mailto:)/i.test(link.url));
const cvSections = [
  timeline('Deneyim', profile.deneyim),
  timeline('Eğitim', profile.egitim),
  profile.beceriler.length ? `<section class="cv-section"><h2>Beceriler</h2><ul class="cv-skills">${profile.beceriler.map(skill => `<li>${escape(skill)}</li>`).join('')}</ul></section>` : '',
  profileLinks.length ? `<section class="cv-section"><h2>Bağlantılar</h2><ul class="cv-links">${profileLinks.map(link => `<li><a href="${escape(link.url)}">${escape(link.etiket)}</a></li>`).join('')}</ul></section>` : '',
].filter(Boolean);
const cv = layout({
  title: 'Özgeçmiş', summary: profile.hakkimda || 'Kişisel özgeçmiş.', page: 'cv', scripts: ['article'],
  body: `<main id="icerik" class="shell inner-page cv-page">
    <a class="back-link" href="/">Ana sayfa</a>
    <header class="page-heading cv-heading">
      <div>${profile.ad ? '<p class="category">Özgeçmiş</p>' : ''}<h1>${escape(profile.ad || 'Özgeçmiş')}</h1>${profile.unvan ? `<p>${escape(profile.unvan)}</p>` : ''}</div>
      ${cvSections.length ? '<button class="button secondary" type="button" data-print hidden>Yazdır / PDF</button>' : ''}
    </header>
    <div class="cv-content">
      ${profile.hakkimda ? `<section class="cv-section"><h2>Hakkımda</h2><p>${escape(profile.hakkimda)}</p></section>` : ''}
      ${cvSections.join('') || '<p class="cv-empty">Özgeçmiş bilgileri henüz eklenmedi.</p>'}
    </div>
  </main>`,
});

await rm('dist', { recursive: true, force: true });
await mkdir('dist/ozgecmis', { recursive: true });
await cp('src/assets', 'dist/assets', { recursive: true });
const fonts = {
  '@fontsource-variable/manrope': ['manrope-latin-wght-normal.woff2', 'manrope-latin-ext-wght-normal.woff2'],
  '@fontsource/instrument-serif': ['instrument-serif-latin-400-italic.woff2'],
};
for (const [family, files] of Object.entries(fonts)) {
  for (const file of files) await cp(`node_modules/${family}/files/${file}`, `dist/assets/${file}`);
  await cp(`node_modules/${family}/LICENSE`, `dist/assets/${family.split('/')[1]}-LICENSE.txt`);
}
await writeFile('dist/index.html', home);
await writeFile('dist/ozgecmis/index.html', cv);
for (const post of posts) {
  const directory = `dist/yazilar/${post.slug}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, postPage(post));
}
console.log(`Derlendi: ana sayfa, özgeçmiş, ${posts.length} yazı.`);
