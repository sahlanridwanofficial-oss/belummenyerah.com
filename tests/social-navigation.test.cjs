const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');

function renderNav(pathname) {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/NavRedaksi.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const mocks = {
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    'next/navigation': { usePathname: () => pathname, useRouter: () => ({ replace() {}, refresh() {} }) },
    '@/components/ArrowIcon': () => React.createElement('span', { 'aria-hidden': true }, '↗'),
    '@/lib/supabase/client': { klienBrowser: () => { throw new Error('No auth or network call allowed in navigation test'); } },
  };
  new Function('require', 'module', 'exports', code)((id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return new JSDOM(renderToStaticMarkup(React.createElement(module.exports.default)));
}

test('proposed navigation adds exactly one private social link without changing existing menu order', () => {
  const dom = renderNav('/admin/sosial');
  try {
    const links = [...dom.window.document.querySelectorAll('nav a')];
    assert.deepEqual(links.slice(0, 4).map((a) => [a.getAttribute('href'), a.textContent]), [['/admin','Arsip tulisan'], ['/admin/kursus','Kursus'], ['/admin/sosial','Sosial'], ['/admin/pelanggan','Pelanggan']]);
    assert.equal(links.filter((a) => a.getAttribute('href') === '/admin/sosial').length, 1);
    assert.equal(dom.window.document.querySelector('a[aria-current="page"]').getAttribute('href'), '/admin/sosial');
  } finally { dom.window.close(); }
});

test('social descendants highlight the social menu without highlighting root archive', () => {
  const dom = renderNav('/admin/sosial/review/contoh');
  try {
    assert.equal(dom.window.document.querySelectorAll('[aria-current="page"]').length, 1);
    assert.equal(dom.window.document.querySelector('[aria-current="page"]').getAttribute('href'), '/admin/sosial');
  } finally { dom.window.close(); }
});

test('login navigation reveals no admin menu links', () => {
  const dom = renderNav('/admin/login');
  try {
    assert.equal(dom.window.document.querySelectorAll('a[href^="/admin"]').length, 0);
    assert.equal(dom.window.document.querySelector('a').getAttribute('href'), '/');
  } finally { dom.window.close(); }
});
