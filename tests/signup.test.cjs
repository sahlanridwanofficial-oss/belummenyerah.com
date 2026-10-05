const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { loadSource, installDOM, deferred } = require('./helpers.cjs');

const dom = installDOM();
const { createRoot } = require('react-dom/client');
const { act } = React;
const FormLangganan = loadSource('src/components/FormLangganan.tsx').default;
after(() => dom.close());

const scenarios = [
  {
    name: 'newsletter',
    props: { sumber: 'beranda' },
    endpoint: '/api/berlangganan',
    payload: { email: 'pemilik@example.test', sumber: 'beranda' },
  },
  {
    name: 'course',
    props: { sumber: 'halaman-kursus', kursusSlug: 'uang-usaha' },
    endpoint: '/api/daftar-kursus',
    payload: { email: 'pemilik@example.test', slug: 'uang-usaha' },
  },
];

function response(status, body = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

async function mount(t, props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(React.createElement(FormLangganan, props)));
  t.after(async () => {
    await act(async () => root.unmount());
    container.remove();
  });
  return container;
}

async function setEmail(container, value) {
  const input = container.querySelector('input');
  input.focus();
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  assert.equal(input.value, value);
  return input;
}

async function submit(container) {
  await act(async () => {
    container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  });
}

function mockFetch(t, scenario, responder) {
  return t.mock.method(globalThis, 'fetch', async (url, options) => {
    // Every request is mocked and checked. This suite never calls either live API.
    assert.equal(url, scenario.endpoint);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), scenario.payload);
    return responder();
  });
}

for (const scenario of scenarios) {
  test(`${scenario.name}: pending submission is announced, prevents repeated sends, then focuses confirmation`, async (t) => {
    const pending = deferred();
    const fetchMock = mockFetch(t, scenario, () => pending.promise);
    const container = await mount(t, scenario.props);
    const input = await setEmail(container, scenario.payload.email);
    const label = container.querySelector('label');
    assert.equal(label.htmlFor, input.id);
    assert.equal(input.required, true);
    assert.equal(input.type, 'email');
    assert.equal(input.autocomplete, 'email');
    assert.ok(document.getElementById(input.getAttribute('aria-describedby')));

    await submit(container);
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(container.querySelector('form').getAttribute('aria-busy'), 'true');
    assert.equal(container.querySelector('button').disabled, true);
    assert.match(container.querySelector('button').textContent, /Mengirim/);
    assert.equal(input.value, scenario.payload.email);
    assert.equal(container.querySelector('[role="status"]'), null);

    await submit(container);
    assert.equal(fetchMock.mock.callCount(), 1, 'a pending form cannot issue a second request');
    await act(async () => pending.resolve(response(200, { pesan: 'Pendaftaran berhasil diproses.' })));
    const confirmation = container.querySelector('[role="status"]');
    assert.ok(confirmation);
    assert.equal(confirmation.tabIndex, -1);
    assert.equal(document.activeElement, confirmation, 'keyboard focus moves to the confirmation');
    assert.match(confirmation.textContent, /Pendaftaran berhasil diproses\./);
    assert.equal(container.querySelector('form'), null);
    assert.equal(container.querySelector('input'), null, 'email field is removed after success');
  });

  test(`${scenario.name}: server validation error is linked to the email and a corrected retry succeeds`, async (t) => {
    let attempt = 0;
    const fetchMock = mockFetch(t, scenario, () => ++attempt === 1
      ? response(400, { pesan: 'Alamat email belum valid.' })
      : response(200, { pesan: 'Terima kasih, email diterima.' }));
    const container = await mount(t, scenario.props);
    const input = await setEmail(container, scenario.payload.email);
    await submit(container);

    const alert = container.querySelector('[role="alert"]');
    assert.equal(alert.textContent, 'Alamat email belum valid.');
    assert.equal(input.getAttribute('aria-describedby'), alert.id);
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    assert.equal(input.value, scenario.payload.email, 'retry retains entered email');
    assert.equal(container.querySelector('form').getAttribute('aria-busy'), 'false');
    assert.equal(container.querySelector('button').disabled, false);

    await setEmail(container, 'editing@example.test');
    assert.equal(input.hasAttribute('aria-invalid'), false, 'editing clears the invalid state');
    await setEmail(container, scenario.payload.email);
    await submit(container);
    assert.equal(fetchMock.mock.callCount(), 2);
    const confirmation = container.querySelector('[role="status"]');
    assert.match(confirmation.textContent, /Terima kasih, email diterima/);
    assert.equal(document.activeElement, confirmation);
    assert.equal(container.querySelector('[role="alert"]'), null);
  });

  test(`${scenario.name}: unavailable service preserves email without blaming its validity`, async (t) => {
    mockFetch(t, scenario, () => response(503));
    const container = await mount(t, scenario.props);
    const input = await setEmail(container, scenario.payload.email);
    await submit(container);
    assert.match(container.querySelector('[role="alert"]').textContent, /Pendaftaran gagal/);
    assert.equal(input.hasAttribute('aria-invalid'), false);
    assert.equal(input.value, scenario.payload.email);
    assert.equal(container.querySelector('button').disabled, false);
    assert.equal(container.querySelector('[role="status"]'), null);
  });

  test(`${scenario.name}: rejected network request can be retried and then announces success`, async (t) => {
    let attempt = 0;
    const fetchMock = mockFetch(t, scenario, () => {
      if (++attempt === 1) throw new TypeError('Mock network failure');
      return response(200, { pesan: 'Berhasil setelah mencoba lagi.' });
    });
    const container = await mount(t, scenario.props);
    const input = await setEmail(container, scenario.payload.email);
    await submit(container);
    assert.match(container.querySelector('[role="alert"]').textContent, /Koneksi bermasalah/);
    assert.equal(input.value, scenario.payload.email);
    assert.equal(input.hasAttribute('aria-invalid'), false);
    assert.equal(container.querySelector('button').disabled, false);
    await submit(container);
    assert.equal(fetchMock.mock.callCount(), 2);
    assert.equal(document.activeElement, container.querySelector('[role="status"]'));
    assert.match(container.textContent, /Berhasil setelah mencoba lagi/);
  });
}

test('course: its custom confirmation overrides API copy without losing focus', async (t) => {
  const scenario = scenarios[1];
  mockFetch(t, scenario, () => response(200, { pesan: 'API default' }));
  const container = await mount(t, { ...scenario.props, pesanBerhasil: 'Kamu akan mendapat kabar materi berikutnya.' });
  await setEmail(container, scenario.payload.email);
  await submit(container);
  const confirmation = container.querySelector('[role="status"]');
  assert.match(confirmation.textContent, /Kamu akan mendapat kabar materi berikutnya/);
  assert.doesNotMatch(confirmation.textContent, /API default/);
  assert.equal(document.activeElement, confirmation);
});

test('newsletter: missing server message has a useful fallback confirmation', async (t) => {
  const scenario = scenarios[0];
  mockFetch(t, scenario, () => response(200));
  const container = await mount(t, scenario.props);
  await setEmail(container, scenario.payload.email);
  await submit(container);
  assert.match(container.querySelector('[role="status"]').textContent, /Emailmu sudah terdaftar/);
});

test('malformed server response is recoverable and does not show false success', async (t) => {
  const scenario = scenarios[0];
  mockFetch(t, scenario, () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Mock non-JSON response'); } }));
  const container = await mount(t, scenario.props);
  await setEmail(container, scenario.payload.email);
  await submit(container);
  assert.ok(container.querySelector('[role="alert"]'));
  assert.equal(container.querySelector('[role="status"]'), null);
  assert.equal(container.querySelector('button').disabled, false);
});
