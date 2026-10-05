const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const { project, loadSource } = require('./helpers.cjs');

const read = (file) => fs.readFileSync(path.join(project, file), 'utf8');
const parse = (file) => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function visit(source, callback) {
  function walk(node) { callback(node); ts.forEachChild(node, walk); }
  walk(source);
}

function sourceFiles(directory) {
  return fs.readdirSync(path.join(project, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(relative) : /\.[jt]sx?$/.test(entry.name) ? [relative] : [];
  });
}

test('the removed calculator is neither imported nor rendered anywhere in application source', () => {
  for (const file of sourceFiles('src')) {
    const source = parse(file);
    visit(source, (node) => {
      if (ts.isImportDeclaration(node)) {
        assert.doesNotMatch(node.moduleSpecifier.text, /(?:KartuKas|PanggungKas|Kalkulator|Calculator|\/lib\/kas$)/i, file);
      }
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        assert.doesNotMatch(node.tagName.getText(source), /(?:KartuKas|PanggungKas|Kalkulator|Calculator)/i, file);
      }
    });
  }
});

test('homepage, masthead and footer link to the implemented /blog and /belajar routes', () => {
  assert.ok(fs.existsSync(path.join(project, 'src/app/blog/page.tsx')));
  assert.ok(fs.existsSync(path.join(project, 'src/app/belajar/page.tsx')));
  for (const file of ['src/app/page.tsx', 'src/components/Masthead.tsx', 'src/components/Kaki.tsx']) {
    const hrefs = [];
    visit(parse(file), (node) => {
      if (ts.isJsxAttribute(node) && node.name.text === 'href' && node.initializer && ts.isStringLiteral(node.initializer)) hrefs.push(node.initializer.text);
    });
    assert.ok(hrefs.includes('/blog'), `${file} links to Blog`);
    assert.ok(hrefs.includes('/belajar'), `${file} links to Belajar`);
    assert.ok(!hrefs.some((href) => /^\/(?:baca|kursus)(?:\/|$)/.test(href)), `${file} does not use obsolete route names`);
  }
});

test('homepage uses actual HumanStory with Three and has no video-story code', () => {
  const packageJson = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(packageJson.dependencies.three, '^0.180.0');
  assert.equal(lock.packages['node_modules/three'].version, '0.180.0');
  let storyImports = 0, storyElements = 0;
  visit(parse('src/app/page.tsx'), node => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === '@/components/HumanStory') storyImports++;
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === 'HumanStory') storyElements++;
  });
  assert.equal(storyImports, 1); assert.equal(storyElements, 1);
  for (const file of sourceFiles('src')) {
    visit(parse(file), node => {
      if (ts.isImportDeclaration(node)) assert.doesNotMatch(node.moduleSpecifier.text, /(?:CinematicStory|scroll-video|story-media)/, file);
    });
  }
  for (const file of ['src/components/CinematicStory.tsx', 'src/lib/scroll-video.ts', 'src/lib/story-media.ts']) assert.ok(!fs.existsSync(path.join(project, file)));
  assert.doesNotMatch(read('src/components/HumanStory.tsx'), /<video|Pratinjau konsep|video sedang disiapkan/);
});

test('live scene CSS preserves 44px controls, mobile scene separation and short-landscape layout', () => {
  const css = read('src/app/interface.css');
  assert.doesNotMatch(css, /cinematic-story|__video|__poster|__media-note/);
  assert.match(css, /\.human-story__canvas canvas/);
  assert.match(css, /\.human-story__fallback img/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /\.human-story__fallback, \.human-story__canvas \{ left: 47%; width: 53%; height: 100%;/);
});

async function renderHome({ connected, courses = [], articles = [] }) {
  const calls = { courses: 0, articles: [] };
  const Link = ({ children, ...props }) => React.createElement('a', props, children);
  const Logo = () => React.createElement('span', { 'aria-hidden': true }, 'BM');
  const Form = loadSource('src/components/FormLangganan.tsx').default;
  const Home = loadSource('src/app/page.tsx', {
    'next/link': Link,
    '@/components/Masthead': () => React.createElement('header', null),
    '@/components/Kaki': () => React.createElement('footer', null),
    '@/components/FormLangganan': Form,
    '@/components/BelumTersambung': () => React.createElement('p', { 'data-connection-warning': true }, 'Belum tersambung'),
    '@/components/HumanStory': () => React.createElement('div', { 'data-human-story': true }),
    '@/components/Logo': { TandaLogo: Logo },
    '@/components/KartuKursus': ({ kursus }) => React.createElement('article', { 'data-course-id': kursus.id }, React.createElement('a', { href: `/belajar/${kursus.slug}` }, kursus.judul)),
    '@/components/KartuTulisan': ({ tulisan }) => React.createElement('article', { 'data-article-id': tulisan.id }, React.createElement('a', { href: `/blog/${tulisan.slug}` }, tulisan.judul)),
    '@/lib/supabase/server': { supabaseTerpasang: () => connected },
    '@/lib/kursus': { ambilKatalogRingkas: async () => { calls.courses++; return courses; } },
    '@/lib/tulisan': { ambilTerbit: async (limit) => { calls.articles.push(limit); return articles; } },
  }).default;
  const html = renderToStaticMarkup(await Home());
  return { dom: new JSDOM(html), calls };
}

for (const connected of [false, true]) {
  test(`empty homepage (${connected ? 'connected but empty' : 'database not configured'}) shows honest preparation states without sample courses or audience metrics`, async () => {
    const { dom, calls } = await renderHome({ connected });
    try {
      const { document } = dom.window;
      const text = document.body.textContent.replace(/\s+/g, ' ');
      assert.equal(document.querySelectorAll('[data-course-id], [data-article-id]').length, 0);
      assert.equal(document.querySelectorAll('a[href^="/belajar/"], a[href^="/blog/"]').length, 0, 'no invented content routes');
      assert.match(text, /Kelas pertama/);
      assert.match(text, /SEDANG DISIAPKAN/);
      assert.match(text, /Catatan pertama sedang disiapkan/);
      assert.doesNotMatch(text, /\b\d[\d.,]*\s*(?:\+|k|ribu|juta)?\s*(?:peserta|pelajar|alumni|lulusan|UMKM|pengusaha)\b/i, 'no made-up social-proof counts');
      assert.equal(document.querySelectorAll('form').length, 2, 'readers can subscribe from the course empty state and newsletter');
      assert.equal(document.querySelectorAll('[data-connection-warning]').length, connected ? 0 : 1);
      assert.equal(calls.courses, connected ? 1 : 0);
      assert.deepEqual(calls.articles, connected ? [4] : []);
      assert.ok(document.querySelector('a[href="/blog"]'));
      assert.ok(document.querySelector('a[href="/belajar"]'));
    } finally { dom.window.close(); }
  });
}

test('populated homepage renders only provided real catalog/articles and removes preparation states', async () => {
  const courses = Array.from({ length: 6 }, (_, i) => ({ id: `course-${i}`, slug: `kelas-terbit-${i}`, judul: `Kelas terbit ${i}` }));
  const articles = Array.from({ length: 3 }, (_, i) => ({ id: `article-${i}`, slug: `catatan-terbit-${i}`, judul: `Catatan terbit ${i}` }));
  const { dom, calls } = await renderHome({ connected: true, courses, articles });
  try {
    const { document } = dom.window;
    assert.deepEqual(Array.from(document.querySelectorAll('[data-course-id]'), (node) => node.dataset.courseId), courses.slice(0, 4).map((item) => item.id));
    assert.deepEqual(Array.from(document.querySelectorAll('[data-article-id]'), (node) => node.dataset.articleId), articles.map((item) => item.id));
    assert.deepEqual(Array.from(document.querySelectorAll('a[href^="/belajar/"]'), (node) => node.getAttribute('href')), courses.slice(0, 4).map((item) => `/belajar/${item.slug}`));
    assert.equal(document.querySelector('.nk-coming-class'), null);
    assert.equal(document.querySelector('.nk-insight-empty'), null);
    assert.equal(document.querySelectorAll('form').length, 1);
    assert.equal(calls.courses, 1);
    assert.deepEqual(calls.articles, [4]);
  } finally { dom.window.close(); }
});


test('the public interface and real-time worlds use the approved warm sunset direction', () => {
  const css = read('src/app/interface.css');
  const runtime = read('src/lib/human-scenes.ts');
  assert.match(css, /--school-orange: #a3411f/);
  assert.match(css, /--school-ink: #3b261e/);
  assert.match(css, /color: #fff; \}/);
  assert.match(css, /stroke: #14141b/);
  assert.doesNotMatch(css, /school-cobalt|school-lilac|#b5ace1|#343dcc|#d5cef2/);
  assert.match(runtime, /const COLORS = \["#f6d8b8", "#f4cbac", "#f0c29d"\]/);
  assert.doesNotMatch(runtime, /#535faa|#ff91d8|#8ad8ff/);
});
