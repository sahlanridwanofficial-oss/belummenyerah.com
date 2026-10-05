const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const { loadSource } = require('./helpers.cjs');
const { sceneDOM } = require('./human-test-helpers.cjs');
const { act } = React;
const next = {
  'next/link': ({ children, ...props }) => React.createElement('a', props, children),
  'next/image': ({ fill, priority, unoptimized, ...props }) => React.createElement('img', props),
};
function assertPanels(container, active) {
  const panels = [...container.querySelectorAll('.human-story__copy')];
  assert.equal(panels.length, 3);
  panels.forEach((panel, index) => {
    assert.equal(panel.hasAttribute('inert'), index !== active, 'inactive panels cannot receive focus');
    assert.equal(panel.getAttribute('aria-hidden'), String(index !== active));
    assert.equal(panel.dataset.active, String(index === active));
  });
}
async function mount(t, options = {}) {
  const env = sceneDOM(t, options);
  if (options.saveData) Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  const { createRoot } = require('react-dom/client');
  const instances = [];
  let imports = 0;
  const Component = loadSource('src/components/HumanStory.tsx', {
    ...next,
    '@/lib/human-scenes': { get createHumanScenes() { imports++; return (host, status) => {
      if (options.failConstruction) throw new Error('Mock WebGL unavailable');
      const instance = { host, status, progress: [], pauses: [], disposed: 0 };
      instances.push(instance);
      return { setProgress: value => instance.progress.push(value), pause: value => instance.pauses.push(value), dispose: () => instance.disposed++ };
    }; } },
  }).default;
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  let mounted = true;
  const unmount = async () => { if (mounted) { mounted = false; await act(async () => root.unmount()); } };
  env.cleanup(async () => { await unmount(); container.remove(); });
  await act(async () => root.render(React.createElement(Component)));
  if (!options.offscreen) await act(async () => env.observers.intersection[0].callback([{ isIntersecting: true }]));
  const section = container.querySelector('.human-story');
  let top = 0;
  section.getBoundingClientRect = () => ({ top, height: 2720, width: 1280, left: 0 });
  const scroll = async (progress) => { top = -1000 * progress; await act(async () => { window.dispatchEvent(new window.Event('scroll')); env.tick(); }); };
  return { env, container, instances, unmount, scroll, get imports() { return imports; }, ready: async (index = 0, value = true) => act(async () => instances.at(-1).status(index, value)) };
}

test('SSR provides the real learning poster, meaningful text, links and a no-JavaScript escape from the sticky journey', () => {
  let constructions = 0;
  const Component = loadSource('src/components/HumanStory.tsx', { ...next, '@/lib/human-scenes': { createHumanScenes() { constructions++; } } }).default;
  const html = renderToStaticMarkup(React.createElement(Component));
  const dom = new JSDOM(html);
  try {
    const document = dom.window.document;
    assert.equal(constructions, 0);
    assert.equal(document.querySelector('.human-story__fallback img').getAttribute('src'), '/scenes/learning.webp');
    assert.equal(document.querySelector('img').getAttribute('alt'), '');
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.ok(document.querySelector('a[href="/belajar"]')); assert.ok(document.querySelector('a[href="/blog"]'));
    assert.match(document.querySelector('.khusus-pembaca-layar').textContent, /model manusia 3D/);
    const noscript = document.querySelector('noscript').textContent;
    assert.match(noscript, /height: 100svh/); assert.match(noscript, /display: none/); assert.match(noscript, /human-story__scroll/);
    assert.equal(document.querySelector('.human-story__canvas').style.opacity, '0');
    assertPanels(document, 0);
  } finally { dom.window.close(); }
});

test('scroll selects all three actual contexts and matching static posters, while inactive text remains inert', async t => {
  const scene = await mount(t);
  for (const [index, name] of ['learning', 'business', 'collaboration'].entries()) {
    await scene.scroll(index);
    assert.equal(scene.container.querySelector('.human-story').dataset.scene, String(index));
    assert.equal(scene.container.querySelector('img').getAttribute('src'), `/scenes/${name}.webp`);
    assert.equal(scene.instances[0].progress.at(-1), index);
    assertPanels(scene.container, index);
    assert.equal(scene.container.querySelectorAll('[aria-current="step"]').length, 1);
    assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '0');
    await scene.ready(index);
    assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '1');
  }
});

test('pause, resume and live reduced-motion changes cleanly switch between renderer and posters', async t => {
  const scene = await mount(t);
  await scene.ready();
  const button = () => scene.container.querySelector('.human-story__controls button');
  assert.match(button().textContent, /Jeda/);
  await act(async () => button().click());
  assert.equal(scene.instances[0].pauses.at(-1), true);
  assert.equal(button().getAttribute('aria-pressed'), 'true');
  await act(async () => button().click());
  assert.equal(scene.instances[0].pauses.at(-1), false);
  await act(async () => scene.env.reduced.change(true));
  assert.equal(scene.instances[0].disposed, 1);
  assert.equal(button(), null);
  assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '0');
  await act(async () => scene.env.reduced.change(false));
  assert.equal(scene.instances.length, 2);
  assert.equal(scene.instances[1].pauses.at(-1), false);
  await scene.ready(); assert.ok(button());
});

test('reduced-motion readers stay on matching posters without importing Three or constructing a renderer', async t => {
  const scene = await mount(t, { reduced: true });
  assert.equal(scene.instances.length, 0);
  assert.equal(scene.imports, 0);
  assert.equal(scene.container.querySelector('.human-story__controls button'), null, 'intentional static mode is not an error');
  assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '0');
  const requests = []; window.scrollTo = request => requests.push(request);
  await act(async () => scene.container.querySelector('[aria-label="Menjalankan usaha"]').click());
  assert.deepEqual(requests, [{ top: 1000, behavior: 'auto' }]);
  await scene.scroll(2);
  assert.equal(scene.container.querySelector('img').getAttribute('src'), '/scenes/collaboration.webp');
  assertPanels(scene.container, 2);
  assert.equal(scene.instances.length, 0); assert.equal(scene.imports, 0);
});

test('failed WebGL preserves a usable static experience', async t => {
  const scene = await mount(t, { failConstruction: true });
  assert.ok(scene.container.querySelector('img[src="/scenes/learning.webp"]'));
  assert.match(scene.container.querySelector('.human-story__controls').textContent, /Ilustrasi statis/);
  assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '0');
  await scene.scroll(2); assertPanels(scene.container, 2);
  assert.ok(scene.container.querySelector('.human-story__copy[data-active="true"] a[href="/blog"]'));
});

test('context loss restores the poster and explicit retry constructs a fresh controller', async t => {
  const scene = await mount(t);
  await scene.ready(); await scene.ready(-1, false);
  assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '0');
  await act(async () => scene.container.querySelector('.human-story__controls button').click());
  assert.equal(scene.instances.length, 2); assert.equal(scene.instances[0].disposed, 1);
  await scene.ready(0); assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '1');
});

test('save-data avoids automatic renderer construction but an explicit retry opts into 3D', async t => {
  const scene = await mount(t, { saveData: true });
  assert.equal(scene.instances.length, 0);
  assert.ok(scene.container.querySelector('img'));
  assert.ok(scene.container.querySelector('a[href="/belajar"]'));
  await act(async () => scene.container.querySelector('.human-story__controls button').click());
  assert.equal(scene.instances.length, 1);
  await scene.ready();
  assert.equal(scene.container.querySelector('.human-story__canvas').style.opacity, '1');
});

test('unmount disposes the renderer controller and cancels scroll work and preference listeners', async t => {
  const scene = await mount(t);
  await scene.ready();
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(scene.env.frames, 1);
  const preference = scene.env.reduced;
  await scene.unmount();
  assert.equal(scene.instances[0].disposed, 1); assert.equal(scene.env.frames, 0); assert.equal(preference.listenerCount, 0);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(scene.env.frames, 0);
  await act(async () => scene.instances[0].status(1, true));
  assert.equal(scene.container.childElementCount, 0, 'late readiness cannot resurrect removed content');
});


test('3D code waits until the story approaches the viewport and only constructs once', async t => {
  const scene = await mount(t, { offscreen: true });
  assert.equal(scene.instances.length, 0);
  assert.ok(scene.container.querySelector('.human-story__fallback img'));
  await act(async () => scene.env.observers.intersection[0].callback([{ isIntersecting: true }]));
  assert.equal(scene.instances.length, 1);
  assert.equal(scene.env.observers.intersection[0].disconnected, true);
  await act(async () => scene.env.observers.intersection[0].callback([{ isIntersecting: true }]));
  assert.equal(scene.instances.length, 1);
});
