const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { loadSource, installDOM, deferred } = require('./helpers.cjs');
const { adminReturnPath } = loadSource('src/lib/admin-return-path.ts');
const dom = installDOM();
const { createRoot } = require('react-dom/client');
const { act } = React;
after(() => dom.close());
const Link = ({children, ...props}) => React.createElement('a', props, children);

async function mount(t, Component, props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(React.createElement(Component, props)));
  t.after(async () => { await act(async () => root.unmount()); container.remove(); });
  return container;
}
async function click(button) { await act(async () => button.click()); }
function button(container, text) { return [...container.querySelectorAll('button')].find(b => b.textContent === text); }

test('login return path stays on admin, rejects executable/external/encoded and escaped paths', () => {
  for (const input of [null, '', 'javascript:alert(1)', '//evil.test/admin', 'https://evil.test/admin', '/admin/../../blog', '/admin\\evil', '/admin/%2e%2e/blog', '/administrator', '/admin/login?lanjut=/admin']) {
    assert.equal(adminReturnPath(input), '/admin', input);
  }
  assert.equal(adminReturnPath('/admin/kursus/abc?tab=edit#isi'), '/admin/kursus/abc?tab=edit#isi');
});

test('admin navigation highlights nested routes and failed logout remains retryable', async t => {
  let calls = 0;
  const moves = [];
  const pending = deferred();
  const Nav = loadSource('src/components/NavRedaksi.tsx', {
    'next/link': Link,
    'next/navigation': { usePathname: () => '/admin/tulis/abc', useRouter: () => ({replace: p => moves.push(p), refresh() {}}) },
    '@/lib/supabase/client': {klienBrowser: () => ({auth: {signOut: async () => { calls++; return calls === 1 ? pending.promise : {error: null}; }}})},
  }).default;
  const container = await mount(t, Nav);
  assert.equal(container.querySelector('[aria-current="page"]').textContent, 'Arsip tulisan');
  await click(button(container, 'Keluar'));
  assert.equal(button(container, 'Keluar…').disabled, true);
  await act(async () => pending.resolve({error: new Error('private backend detail')}));
  assert.match(container.querySelector('[role="alert"]').textContent, /coba lagi/);
  assert.doesNotMatch(container.textContent, /private backend/);
  assert.deepEqual(moves, []);
  await click(button(container, 'Keluar'));
  assert.deepEqual(moves, ['/admin/login']);
});

test('login handles thrown service errors and retries without exposing server details', async t => {
  let attempts = 0;
  const moves = [];
  const Login = loadSource('src/app/admin/login/page.tsx', {
    'next/navigation': {useSearchParams: () => new URLSearchParams('lanjut=javascript:alert(1)'), useRouter: () => ({replace: p => moves.push(p), refresh() {}})},
    '@/lib/admin-return-path': {adminReturnPath},
    '@/lib/supabase/client': {klienBrowser: () => ({auth: {signInWithPassword: async () => { if (++attempts === 1) throw new Error('private server detail'); return {error: null}; }}})},
  }).default;
  const container = await mount(t, Login);
  const submit = async () => act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', {bubbles: true, cancelable: true})));
  await submit();
  assert.match(container.querySelector('[role="alert"]').textContent, /coba lagi/);
  assert.doesNotMatch(container.textContent, /private server detail/);
  assert.equal(container.querySelector('button').disabled, false);
  await submit();
  assert.deepEqual(moves, ['/admin']);
});

for (const file of ['src/app/admin/page.tsx', 'src/app/admin/kursus/page.tsx', 'src/app/admin/pelanggan/page.tsx']) {
  test(`${file} shows database errors rather than false empty state`, async () => {
    const query = { select() {return this;}, order() {return this;}, limit() {return this;}, then(resolve) {return Promise.resolve({data: null, error: {message:'private error'}}).then(resolve);} };
    const Page = loadSource(file, {
      'next/link': Link,
      '@/lib/supabase/server': {supabaseTerpasang: () => true, klienServer: async () => ({from: () => query})},
      '@/components/BelumTersambung': () => null,
      '@/lib/format': {}, '@/lib/kursus': {},
    }).default;
    const html = renderToStaticMarkup(await Page());
    assert.match(html, /role="alert"/);
    assert.match(html, /belum bisa dimuat/);
    assert.doesNotMatch(html, /private error|Belum ada/);
  });
}

test('archive editor preserves data, labels publishing honestly, and recovers from failed save', async t => {
  const calls = [];
  const saves = deferred();
  const format = loadSource('src/lib/format.ts');
  const Editor = loadSource('src/components/EditorTulisan.tsx', {
    'next/navigation': {useRouter: () => ({replace() {}, refresh() {}})},
    '@/lib/format': format,
    '@/lib/markdown': loadSource('src/lib/markdown.ts'),
    '@/lib/belum-tersimpan': loadSource('src/lib/belum-tersimpan.ts'),
    '@/app/admin/aksi': { simpanTulisan: async form => { calls.push(form); if (calls.length === 1) return saves.promise; return {ok:true, pesan:'Tersimpan.', id:'archive-1'}; }, hapusTulisan: async () => {throw new Error('Unexpected deletion');}},
  }).default;
  const awal = {id:'archive-1', judul:'Arsip', slug:'', deck:'Ringkas', isi:'Isi asli <img src="x" onerror="alert(1)">', format:'catatan', nomor:null, penulis:'Redaksi', status:'draf'};
  const container = await mount(t, Editor, {awal});
  assert.match(container.textContent, /tidak mengubah blog publik/);
  assert.doesNotMatch(container.textContent, /Terbitkan|\/blog\//);
  assert.equal(button(container, 'Kirim ke pelanggan').disabled, true);
  await click(button(container, 'Simpan & siap dikirim'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].status, 'terbit');
  assert.equal(calls[0].isi, awal.isi);
  assert.equal(container.querySelector('#judul').disabled, true);
  assert.equal(button(container, 'Hapus').disabled, true);
  await act(async () => saves.reject(new Error('network')));
  assert.match(container.querySelector('[role="status"]').textContent, /belum berhasil disimpan/);
  assert.equal(container.querySelector('#judul').value, awal.judul);
  await click(button(container, 'Simpan & siap dikirim'));
  assert.equal(container.querySelector('#slug').value, 'arsip');
  assert.equal(container.querySelector('.tanda-belum-simpan'), null);
  assert.equal(button(container, 'Kirim ke pelanggan').disabled, false);
  await click(button(container, 'Pratinjau'));
  assert.ok(container.querySelector('.pratinjau'));
  assert.equal(container.querySelector('.pratinjau [onerror]'), null);
});
