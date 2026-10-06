const { test } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { loadSource, installDOM } = require('./helpers.cjs');

/** Real geometry, deterministic DOM/RAF, mocked renderer. Browser QA tests GPU output separately. */
function runtime(t, options = {}) {
  const dom = installDOM();
  const originals = new Map();
  function replace(name, value) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  const mediaListeners = new Set();
  const media = {
    matches: options.reduced ?? false,
    addEventListener(_, callback) { mediaListeners.add(callback); },
    removeEventListener(_, callback) { mediaListeners.delete(callback); },
    change(value) { this.matches = value; for (const callback of mediaListeners) callback(); },
  };
  window.matchMedia = () => media;
  Object.defineProperty(window, 'innerWidth', { value: options.viewportWidth ?? 1280 });
  Object.defineProperty(window, 'devicePixelRatio', { value: 3 });
  let serial = 0, time = 1000;
  const pending = new Map();
  replace('requestAnimationFrame', callback => { const id = ++serial; pending.set(id, callback); return id; });
  replace('cancelAnimationFrame', id => pending.delete(id));
  const observers = [];
  replace('ResizeObserver', class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  });
  const renders = [], renderers = [], statuses = [];
  class Renderer {
    constructor() {
      if (options.constructorError) throw new Error('GPU unavailable');
      this.domElement = document.createElement('canvas');
      this.shadowMap = {};
      this.disposals = 0;
      renderers.push(this);
    }
    setPixelRatio(value) { this.pixelRatio = value; }
    setSize(width, height) { this.size = [width, height]; }
    setClearColor(color, alpha) { this.clearAlpha = alpha; }
    render(scene, camera) {
      if (options.renderError) throw new Error('Render failed');
      this.scene = scene;
      scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      renders.push({ rootY: scene.children[0].position.y, rootRotation: scene.children[0].rotation.y, camera: camera.clone() });
    }
    dispose() { this.disposals++; }
  }
  const model = loadSource('src/lib/bekal-model.ts');
  const { startBekalScene } = loadSource('src/lib/bekal-scene.ts', { three: { ...THREE, WebGLRenderer: Renderer }, './bekal-model': model });
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { value: options.width ?? 440, configurable: true });
  Object.defineProperty(host, 'clientHeight', { value: options.height ?? 440, configurable: true });
  document.body.appendChild(host);
  const controller = startBekalScene(host, {
    onReady: () => { assert.ok(renders.length > 0, 'first render must precede readiness'); statuses.push('ready'); },
    onError: error => statuses.push(error.message),
  });
  t.after(() => {
    controller.dispose();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.close();
  });
  return {
    host, controller, media, mediaListeners, observers, renderers, renders, statuses,
    get frames() { return pending.size; },
    tick(count = 1) {
      for (let i = 0; i < count; i++) {
        const callbacks = [...pending.values()]; pending.clear(); time += 16;
        for (const callback of callbacks) callback(time);
      }
    },
  };
}

test('Bekal readiness follows first transparent render; camera is responsive and DPR bounded', t => {
  const scene = runtime(t);
  assert.deepEqual(scene.statuses, ['ready']);
  assert.equal(scene.host.querySelectorAll('canvas').length, 1);
  assert.equal(scene.renderers[0].clearAlpha, 0);
  assert.equal(scene.renderers[0].pixelRatio, 1.5);
  const camera = scene.renders.at(-1).camera;
  Object.defineProperty(scene.host, 'clientWidth', { value: 220 });
  Object.defineProperty(scene.host, 'clientHeight', { value: 260 });
  scene.observers[0].callback();
  assert.equal(scene.renders.at(-1).camera.aspect, 220 / 260);
  assert.ok(scene.renders.at(-1).camera.position.z > camera.position.z);
  assert.deepEqual(scene.statuses, ['ready']);
});

test('pause and tab hiding cancel RAF; resume and pointer/progress remain bounded', t => {
  const scene = runtime(t);
  scene.tick(4);
  scene.controller.setPointer(999, -999);
  scene.controller.setProgress(99);
  scene.tick(120);
  assert.ok(scene.renders.at(-1).rootRotation <= .061);
  scene.controller.setPaused(true);
  const rendered = scene.renders.length;
  assert.equal(scene.frames, 0);
  scene.tick(20);
  assert.equal(scene.renders.length, rendered);
  scene.controller.setPaused(false);
  assert.equal(scene.frames, 1);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new window.Event('visibilitychange'));
  assert.equal(scene.frames, 0);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  document.dispatchEvent(new window.Event('visibilitychange'));
  assert.equal(scene.frames, 1);
});

test('celebration is a bounded hop and settles after repeated clicks', t => {
  const scene = runtime(t);
  scene.controller.celebrate();
  scene.tick(28);
  assert.ok(scene.renders.at(-1).rootY > .2);
  for (let i = 0; i < 10; i++) scene.controller.celebrate();
  scene.tick(95);
  assert.equal(scene.renders.at(-1).rootY, 0);
  scene.controller.celebrate(); scene.tick(28);
  assert.ok(scene.renders.at(-1).rootY > .2);
});

test('reduced motion renders a stable still and starts no perpetual RAF', t => {
  const scene = runtime(t, { reduced: true, viewportWidth: 390, width: 220, height: 260 });
  assert.equal(scene.frames, 0);
  assert.equal(scene.renderers[0].pixelRatio, 1.25);
  scene.controller.celebrate(); scene.controller.setPointer(1, 1); scene.tick(10);
  assert.equal(scene.frames, 0);
  assert.equal(scene.renders.at(-1).rootY, 0);
  scene.controller.setProgress(.8);
  assert.equal(scene.frames, 0);
  scene.media.change(false);
  assert.equal(scene.frames, 1);
  scene.media.change(true);
  assert.equal(scene.frames, 0);
});

test('context loss removes the canvas and releases resources/listeners exactly once', t => {
  const scene = runtime(t);
  const resources = new Set();
  scene.renderers[0].scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      resources.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) resources.add(material);
    }
  });
  const counts = new Map([...resources].map(resource => [resource, 0]));
  for (const resource of resources) resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
  const lost = new window.Event('webglcontextlost', { cancelable: true });
  scene.renderers[0].domElement.dispatchEvent(lost);
  assert.equal(lost.defaultPrevented, true);
  assert.deepEqual(scene.statuses, ['ready', 'The WebGL rendering context was lost.']);
  assert.equal(scene.host.children.length, 0);
  assert.equal(scene.frames, 0);
  assert.equal(scene.mediaListeners.size, 0);
  assert.ok(scene.observers.every(observer => observer.disconnected));
  scene.controller.dispose(); scene.controller.setPaused(false); scene.controller.celebrate();
  assert.equal(scene.renderers[0].disposals, 1);
  assert.ok([...counts.values()].every(count => count === 1));
});

test('renderer creation failure is reported cleanly with an inert controller', t => {
  const scene = runtime(t, { constructorError: true });
  assert.deepEqual(scene.statuses, ['GPU unavailable']);
  assert.equal(scene.host.children.length, 0);
  assert.equal(scene.frames, 0);
  scene.controller.setPaused(false); scene.controller.dispose();
});

test('first-render failure does not call ready and disposes the renderer', t => {
  const scene = runtime(t, { renderError: true });
  assert.deepEqual(scene.statuses, ['Render failed']);
  assert.equal(scene.host.children.length, 0);
  assert.equal(scene.renderers[0].disposals, 1);
  assert.equal(scene.frames, 0);
});

test('the actual animated mesh vertices stay inside the desktop camera during the wave and hop', t => {
  const scene = runtime(t);
  scene.controller.setPointer(1, -1);
  scene.controller.setProgress(1);
  scene.tick(120);
  scene.controller.celebrate();
  const point = new THREE.Vector3();
  for (let step = 0; step < 19; step++) {
    scene.tick(6);
    const camera = scene.renders.at(-1).camera;
    camera.updateMatrixWorld(true);
    scene.renderers[0].scene.children[0].traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const positions = object.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).project(camera);
        assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `${object.name} clips the camera`);
      }
    });
  }
});
