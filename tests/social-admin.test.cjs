const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(relative, mocks = {}) {
  const filename = path.join(root, relative), module = { exports: {} };
  const source = fs.readFileSync(filename, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'server-only') return {};
    if (id.startsWith('@/')) {
      const name = 'src/' + id.slice(2);
      const local = ['.ts', '.tsx'].map((ext) => path.join(root, name + ext)).find((file) => fs.existsSync(file));
      // In the isolated draft, shared guards come from the app whose dependencies
      // are linked here. Once merged, all sources resolve from the local repo.
      const app = path.dirname(fs.realpathSync(path.join(root, 'node_modules')));
      const shared = ['.ts', '.tsx'].map((ext) => path.join(app, name + ext)).find((file) => fs.existsSync(file));
      if (!local && !shared) throw new Error('Missing verified application module: ' + id);
      return load(path.relative(root, local || shared), mocks);
    }
    if (id.startsWith('.')) { const full = path.resolve(path.dirname(filename), id); return load(path.relative(root, full) + (fs.existsSync(full + '.ts') ? '.ts' : '.tsx'), mocks); }
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const V = load('src/lib/sosial/validasi.ts');
const POST = '00000000-0000-4000-8000-000000000001', HASH = 'a'.repeat(64);
const draft = () => ({ platform: 'threads', account_id: null, title: 'Judul kerja', text: 'Teks sederhana untuk diuji.', slides: [], sources: ['Materi situs yang sudah diperiksa'] });

test('schedule defaults are paused, disabled provider fields cannot be smuggled in', () => {
  const settings = V.pengaturanAwal(); assert.equal(settings.creation.paused, true); assert.equal(settings.publishing.paused, true); assert.equal(settings.timezoneConfirmed, false);
  assert.deepEqual(V.validasiPengaturan(settings), settings);
  assert.throws(() => V.validasiPengaturan({ ...settings, provider: 'live' }), /tidak valid/);
  settings.publishing.paused = false; assert.throws(() => V.validasiPengaturan(settings), /tetap dijeda/);
});
test('platform-specific text, slides, sources and unknown fields validated', () => {
  assert.equal(V.validasiDraf(draft()).platform, 'threads');
  assert.throws(() => V.validasiDraf({ ...draft(), text: 'x'.repeat(501) }), /terlalu panjang/);
  assert.throws(() => V.validasiDraf({ ...draft(), platform: 'instagram' }), /2–10/);
  assert.throws(() => V.validasiDraf({ ...draft(), sources: [] }), /sumber/);
  assert.throws(() => V.validasiDraf({ ...draft(), owner_user_id: POST }), /tidak didukung/);
  assert.throws(() => V.validasiDraf({ ...draft(), account_id: 'bad' }), /Identitas/);
});
test('Unicode codepoint limit handles emoji without halving the limit', () => {
  assert.equal(Array.from(V.validasiDraf({ ...draft(), text: '🌱'.repeat(500) }).text).length, 500);
  assert.throws(() => V.validasiDraf({ ...draft(), text: '🌱'.repeat(501) }), /panjang/);
});
test('schedule validates timezone, duplicate days, time and volume', () => {
  for (const mutate of [
    s => { s.timezone = 'Wrong/Zone'; },
    s => { s.creation.localTime = '24:00'; },
    s => { s.publishing.instagram.weekdays = [1, 1]; },
    s => { s.publishing.monthlyNetworkPostCap = 21; },
    s => { s.creation.batchConcepts = 1.5; },
  ]) { const settings = V.pengaturanAwal(); mutate(settings); assert.throws(() => V.validasiPengaturan(settings)); }
});
test('batch approval requires exact unique IDs, safe revisions and SHA256', () => {
  const item = { post_id: POST, revision: 1, content_sha256: HASH };
  assert.deepEqual(V.validasiPersetujuan([item]), [item]);
  assert.throws(() => V.validasiPersetujuan([item, item]), /ganda/);
  assert.throws(() => V.validasiPersetujuan([{ ...item, content_sha256: '' }]), /Sidik/);
  assert.throws(() => V.validasiPersetujuan([{ ...item, publish: true }]), /tidak valid/);
});

function authFixture({ user = { id: POST }, authError = null, admin = true, rpcError = null, installed = true, throws = false } = {}) {
  const calls = [];
  const db = { auth: { getUser: async () => { calls.push('getUser'); if (throws) throw new Error('connection'); return { data: { user }, error: authError }; } }, rpc: async (name) => { calls.push(name); return { data: admin, error: rpcError }; } };
  const guard = load('src/lib/sosial/otorisasi.ts', { '@/lib/supabase/server': { klienServer: async () => db, supabaseTerpasang: () => installed } });
  return { guard, calls, db };
}
test('auth requires verified getUser followed by strict is_admin true', async () => {
  const f = authFixture(); const result = await f.guard.pemilikSosial();
  assert.equal(result.ok, true); assert.equal(result.userId, POST); assert.deepEqual(f.calls, ['getUser', 'is_admin']);
});
test('unauthenticated or getUser errors fail closed before admin lookup', async () => {
  for (const config of [{ user: null }, { authError: { message: 'expired' } }]) {
    const f = authFixture(config); assert.equal((await f.guard.pemilikSosial()).ok, false); assert.deepEqual(f.calls, ['getUser']);
  }
});
test('missing, errored, false or truthy-but-not-boolean admin results fail closed', async () => {
  for (const config of [{ admin: false }, { admin: null }, { admin: 'true' }, { rpcError: { code: 'PGRST202' } }, { throws: true }, { installed: false }]) {
    const f = authFixture(config); assert.equal((await f.guard.pemilikSosial()).ok, false);
  }
});

function actionsFixture({ allowed = true, rpcError = null, data = { post_id: POST, owner_user_id: POST, revision: 1, content_sha256: HASH }, throwRpc = false } = {}) {
  const calls = [], refresh = [];
  const db = { rpc: async (name, args) => { calls.push({ name, args }); if (throwRpc) throw new Error('network'); return { data, error: rpcError }; } };
  const actions = load('src/app/admin/sosial/aksi.ts', {
    '@/lib/sosial/otorisasi': { pemilikSosial: async () => allowed ? { ok: true, supabase: db, userId: POST } : { ok: false, reason: 'forbidden' } },
    '@/lib/sosial/validasi': V, 'next/cache': { revalidatePath: (url) => refresh.push(url) },
  });
  return { actions, calls, refresh };
}
test('server actions never write for an unverified admin', async () => {
  const f = actionsFixture({ allowed: false });
  assert.equal((await f.actions.buatDrafSosial(draft())).ok, false);
  assert.equal((await f.actions.setujuiIsiBatchSosial([{ post_id: POST, revision: 1, content_sha256: HASH }])).ok, false);
  assert.equal((await f.actions.simpanPengaturanSosial(V.pengaturanAwal(), 0)).ok, false);
  assert.equal((await f.actions.revisiDrafSosial(POST, 1, draft())).ok, false);
  assert.deepEqual(f.calls, []); assert.deepEqual(f.refresh, []);
});
test('draft action uses only scoped RPC parameters, never a supplied owner identity', async () => {
  const f = actionsFixture(); assert.equal((await f.actions.buatDrafSosial(draft())).ok, true);
  assert.equal(f.calls[0].name, 'social_create_draft'); assert.equal(Object.hasOwn(f.calls[0].args, 'owner_user_id'), false);
  assert.deepEqual(f.refresh, ['/admin/sosial']);
});
test('validation failure performs no database mutation', async () => {
  const f = actionsFixture(); assert.equal((await f.actions.buatDrafSosial({ ...draft(), text: '' })).ok, false); assert.deepEqual(f.calls, []);
});
test('RPC error and uncertain response never claim a successful save', async () => {
  for (const config of [{ rpcError: { message: 'internal secret detail' } }, { data: null }, { data: {} }, { data: { post_id: POST, owner_user_id: 'wrong-owner', revision: 1, content_sha256: HASH } }, { throwRpc: true }]) {
    const f = actionsFixture(config); const result = await f.actions.buatDrafSosial(draft());
    assert.equal(result.ok, false); assert.ok(!result.pesan.includes('internal secret detail')); assert.deepEqual(f.refresh, []);
  }
});
test('approval action binds hashes and returns content-only language', async () => {
  const f = actionsFixture({ data: [{ id: POST, owner_user_id: POST, post_id: POST, revision: 3, content_sha256: HASH, scope: 'content_only' }] });
  const result = await f.actions.setujuiIsiBatchSosial([{ post_id: POST, revision: 3, content_sha256: HASH }]);
  assert.equal(result.ok, true); assert.match(result.pesan, /belum memberi izin/);
  assert.equal(f.calls[0].args.p_items[0].revision, 3); assert.equal(f.calls[0].args.p_items[0].content_sha256, HASH);
});
test('settings action cannot activate publishing and preserves expected version', async () => {
  const f = actionsFixture({ data: { version: 2, owner_user_id: POST, provider: 'disabled', creation_paused: true, publishing_paused: true } });
  assert.equal((await f.actions.simpanPengaturanSosial(V.pengaturanAwal(), 1)).ok, true);
  assert.equal(f.calls[0].args.p_expected_version, 1); assert.equal(f.calls[0].args.p_settings.publishing.paused, true);
});
test('UI renders stored data as escaped text and has no publishing action', () => {
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  const ui = load('src/components/sosial/MejaKonten.tsx', { 'next/navigation': { useRouter: () => ({ refresh() {} }) }, '@/app/admin/sosial/aksi': {} }).default;
  const content = '<img src=x onerror=alert(1)>';
  const markup = renderToStaticMarkup(React.createElement(ui, { data: { settings: null, accounts: [], posts: [{ id: POST, owner_user_id: POST, platform: 'threads', account_id: null, current_revision: 1, version: { post_id: POST, revision: 1, title: 'Contoh', text: content, slides: [], sources: [content], content_sha256: HASH }, approval: null }] } }));
  assert.ok(markup.includes('&lt;img')); assert.ok(!markup.includes('<img src=x'));
  assert.ok(markup.includes('Provider unggahan dinonaktifkan')); assert.ok(!/>\s*(Unggah sekarang|Terbitkan sekarang)\s*</.test(markup));
  assert.ok(markup.includes('Jam Instagram')); assert.ok(markup.includes('Jam Threads'));
});

test('51- and 100-draft queues cap bulk and individual review selection at 50', async () => {
  const React = require('react'), { createRoot } = require('react-dom/client'), { JSDOM } = require('jsdom');
  const Ui = load('src/components/sosial/MejaKonten.tsx', { 'next/navigation': { useRouter: () => ({ refresh() {} }) }, '@/app/admin/sosial/aksi': {} }).default;
  const originalWindow = global.window, originalDocument = global.document, originalAct = global.IS_REACT_ACT_ENVIRONMENT;
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://offline.invalid' });
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    for (const count of [51, 100]) {
      const container = document.getElementById('root'), root = createRoot(container);
      const posts = Array.from({ length: count }, (_, index) => {
        const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
        return { id, owner_user_id: POST, platform: 'threads', account_id: null, current_revision: 1, version: { post_id: id, revision: 1, title: `Draf ${index + 1}`, text: 'Konten uji', slides: [], sources: ['Sumber uji'], content_sha256: HASH }, approval: null };
      });
      await React.act(async () => root.render(React.createElement(Ui, { data: { settings: null, accounts: [], posts } })));
      const bulk = document.querySelector('.sosial-toolbar input');
      assert.match(bulk.parentElement.textContent, /50 draf pertama/);
      await React.act(async () => bulk.click());
      const boxes = () => [...document.querySelectorAll('input[aria-label^="Pilih "]')];
      assert.equal(boxes().filter((box) => box.checked).length, 50);
      assert.equal(boxes()[50].disabled, true);
      await React.act(async () => boxes()[0].click());
      assert.equal(boxes()[50].disabled, false);
      await React.act(async () => boxes()[50].click());
      assert.equal(boxes().filter((box) => box.checked).length, 50);
      assert.equal(boxes()[0].disabled, true);
      await React.act(async () => root.unmount());
    }
  } finally {
    dom.window.close();
    global.window = originalWindow; global.document = originalDocument; global.IS_REACT_ACT_ENVIRONMENT = originalAct;
  }
});
