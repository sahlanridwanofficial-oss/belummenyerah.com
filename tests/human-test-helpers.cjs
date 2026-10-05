const { installDOM } = require('./helpers.cjs');

function mediaQuery(initial, media) {
  const listeners = new Set();
  return {
    matches: initial, media,
    addEventListener(event, callback) { if (event === 'change') listeners.add(callback); },
    removeEventListener(event, callback) { if (event === 'change') listeners.delete(callback); },
    change(value) { this.matches = value; for (const callback of listeners) callback({ matches: value }); },
    get listenerCount() { return listeners.size; },
  };
}

/** Deterministic DOM/clock only. This never creates a browser, layout engine or GPU. */
function sceneDOM(t, options = {}) {
  const dom = installDOM();
  const previous = new Map();
  const cleanups = [];
  function replace(name, value) {
    if (!previous.has(name)) previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  const reduced = mediaQuery(options.reduced ?? false, '(prefers-reduced-motion: reduce)');
  const fine = mediaQuery(true, '(hover: hover) and (pointer: fine)');
  window.matchMedia = query => query.includes('reduced-motion') ? reduced : fine;
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: options.width ?? 1280 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: options.height ?? 720 });
  const pending = new Map();
  let serial = 0, time = 1000;
  replace('requestAnimationFrame', callback => { const id = ++serial; pending.set(id, callback); return id; });
  replace('cancelAnimationFrame', id => pending.delete(id));
  const observers = { intersection: [], resize: [] };
  for (const [name, kind] of [['IntersectionObserver', 'intersection'], ['ResizeObserver', 'resize']]) {
    replace(name, class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observers[kind].push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
    });
  }
  t.after(async () => {
    for (const cleanup of cleanups.reverse()) await cleanup();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.close();
  });
  return {
    reduced, fine, observers, replace, cleanup(callback) { cleanups.push(callback); },
    get frames() { return pending.size; },
    tick(count = 1) {
      for (let i = 0; i < count; i++) {
        const callbacks = [...pending.values()]; pending.clear(); time += 16;
        for (const callback of callbacks) callback(time);
      }
    },
  };
}
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
module.exports = { sceneDOM, mediaQuery, settle };
