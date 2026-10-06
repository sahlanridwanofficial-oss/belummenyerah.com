const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const { project, loadSource } = require('./helpers.cjs');
const read = file => fs.readFileSync(path.join(project, file), 'utf8');
const Link = ({children,...props}) => React.createElement('a',props,children);
const Title = loadSource('src/components/DontGiveUpTitle.tsx').default;
const Home = loadSource('src/app/page.tsx', {'@/components/ArrowIcon':()=>React.createElement('svg'), 'next/link':Link,'@/components/Masthead':()=>React.createElement('header'),'@/components/DontGiveUpTitle':Title,'@/components/BekalScene':()=>React.createElement('div',{'data-bekal':true})}).default;

test('homepage is a sparse, accessible original title and only two main destinations', () => {
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(Home)));
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.match(doc.querySelector('h1').textContent,/Don’t give up/);
  assert.ok(doc.querySelector('h1 svg[aria-hidden="true"]'));
  assert.deepEqual(Array.from(doc.querySelectorAll('main a')).map(a=>a.getAttribute('href')),['/belajar','/tentang']);
  assert.equal(doc.querySelectorAll('main section, main article, main form').length,0);
  assert.ok(doc.querySelector('[data-bekal]'));
  assert.match(doc.body.textContent,/Belajar gratis/);
  assert.doesNotMatch(doc.body.textContent,/Media|artikel|\d+\s*(peserta|alumni)/i);
  dom.window.close();
});
test('homepage no longer fetches a catalog or articles merely to display a landing screen',()=>{
  assert.doesNotMatch(read('src/app/page.tsx'),/ambilTerbit|ambilKatalog|supabase|KartuTulisan|KartuKursus|HumanStory|FormLangganan/);
});
test('public navigation no longer promotes articles or the removed calculator',()=>{
  for(const file of ['src/app/page.tsx','src/components/Masthead.tsx','src/components/Kaki.tsx','src/app/tentang/page.tsx']) {
    assert.doesNotMatch(read(file),/href="\/blog|KartuKas|Kalkulator|HumanStory/,file);
  }
  assert.ok(!fs.existsSync(path.join(project,'src/components/KartuKas.tsx')));
});
test('original logo geometry remains intact and the symbol-only color constraint is explicit',()=>{
  const logo=read('src/components/Logo.tsx');
  assert.match(logo,/0\.68 \* 360/); assert.match(logo,/strokeDasharray="0 4\.4"/);
  const css=read('src/app/interface.css');
  assert.match(css,/color:#fff; width:42px/);
  assert.match(css,/\.masthead \.tanda-logo \.titik-logo,\.kaki \.tanda-logo \.titik-logo \{ stroke:#fff; \}/);
  assert.match(css,/\.tautan-logo \{[^}]*background:#14140f;/);
  const icon=read('src/app/icon.svg');
  assert.equal((icon.match(/stroke="#ffffff"/g)||[]).length,2);
  assert.match(icon,/fill="#14140f"/);
  for(const file of ['src/components/Masthead.tsx','src/components/Kaki.tsx']) assert.doesNotMatch(read(file),/<Logo\s/);
});
test('paper, ink, butter palette and responsive reduced-motion rules replace old cinematic styling',()=>{
  const css=read('src/app/interface.css');
  assert.match(css,/#f4f3ef/); assert.match(css,/#14140f/); assert.match(css,/#f5ce58/);
  assert.match(css,/max-width:560px/); assert.match(css,/orientation:landscape/); assert.match(css,/prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css,/human-story|school-course|#f6d8b8|#a3411f/);
});
test('no reference artwork, stock humans, or video assets are shipped by the new homepage',()=>{
  const source=read('src/components/DontGiveUpTitle.tsx')+read('src/components/BekalFallback.tsx')+read('src/components/BekalScene.tsx');
  assert.doesNotMatch(source,/dontlookup\.app|Renderpeople|<video|\.glb|\.mp4/);
  assert.ok(!fs.existsSync(path.join(project,'public/models')));
  assert.ok(!fs.existsSync(path.join(project,'src/components/HumanStory.tsx')));
});
test('shared footer resets the legacy outer grid instead of squeezing all content into one column',()=>{
  assert.match(read('src/app/interface.css'),/\.kaki \{ display:block; \}/);
});
test('navigation icons are SVG shapes rather than missing font arrows',()=>{
  for(const file of ['src/app/page.tsx','src/components/Masthead.tsx','src/components/Kaki.tsx','src/components/BekalScene.tsx']) assert.doesNotMatch(read(file),/[↗↖✳▷Ⅱ]/,file);
  assert.match(read('src/components/ArrowIcon.tsx'),/aria-hidden="true"/);
});
