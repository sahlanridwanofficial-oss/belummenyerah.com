const { test } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { project, loadSource, deferred } = require('./helpers.cjs');
const { sceneDOM, settle } = require('./human-test-helpers.cjs');

/** A small real Three skeleton fixture; only loader/network/renderer are replaced. */
function fixture(index, aspect = 16 / 9) {
  const scene = new THREE.Group(); scene.name = `context-${index}`;
  const geometry = new THREE.BoxGeometry(.5, 1.5, .5);
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4); for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  const texture = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map: texture, normalMap: texture, roughnessMap: texture, metalnessMap: texture, color: '#91654b', roughness: .73, metalness: .12 });
  material.normalScale.set(.8, .8);
  const authoredMaterial = { reference: material, map: material.map, normalMap: material.normalMap, roughnessMap: material.roughnessMap, metalnessMap: material.metalnessMap, color: material.color.getHex(), roughness: material.roughness, metalness: material.metalness, normalScale: material.normalScale.toArray() };
  const actor = new THREE.SkinnedMesh(geometry, material);
  const bone = new THREE.Bone(); bone.name = `actor-${index}`;
  actor.add(bone); actor.bind(new THREE.Skeleton([bone]));
  actor.skeleton.computeBoneTexture();
  let boneTextureDisposals = 0;
  actor.skeleton.boneTexture.addEventListener('dispose', () => boneTextureDisposals++);
  actor.position.y = .75;
  // The rest pose deliberately differs from frame zero, as the real GLBs do.
  bone.position.x = -2;
  const camera = new THREE.PerspectiveCamera(35, aspect, .1, 100);
  camera.position.set(index * .3, 2, 6); camera.lookAt(0, .75, 0);
  scene.add(actor, camera); scene.updateMatrixWorld(true);
  const animation = new THREE.AnimationClip(`gesture-${index}`, 2, [new THREE.NumberKeyframeTrack(`${bone.name}.position[x]`, [0, 1, 2], [0, .25, 0])]);
  const disposal = { geometry: 0, material: 0, texture: 0 };
  geometry.addEventListener('dispose', () => disposal.geometry++);
  material.addEventListener('dispose', () => disposal.material++);
  texture.addEventListener('dispose', () => disposal.texture++);
  return { scene, cameras: [camera], animations: [animation], actor, bone, authoredMaterial, disposal, get boneTextureDisposals() { return boneTextureDisposals; } };
}

async function runtime(t, options = {}) {
  const env = sceneDOM(t, options);
  const instances = [], requests = [], statuses = [];
  const assets = [0, 1, 2].map(index => fixture(index, options.authoredAspect));
  let parseCalls = 0, environmentDisposed = 0;
  const decoder = {};
  class Renderer {
    constructor() { this.domElement = document.createElement('canvas'); this.shadowMap = {}; this.renders = []; this.disposed = 0; instances.push(this); }
    setPixelRatio(value) { this.pixelRatio = value; }
    setSize(width, height) { this.size = [width, height]; }
    render(scene, camera) {
      scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); this.lastScene = scene;
      this.renders.push({ camera: camera.clone(), contexts: scene.children.filter(child => child.name.startsWith('context-') && child.visible).map(child => child.name) });
    }
    dispose() { this.disposed++; }
  }
  class Loader {
    setMeshoptDecoder(value) { assert.equal(value, decoder); return this; }
    async parseAsync(data) { parseCalls++; return options.parse ? options.parse(data, assets) : assets[new Uint8Array(data)[0]]; }
  }
  class PMREM {
    fromScene() { return { texture: new THREE.Texture(), dispose() { environmentDisposed++; } }; }
    dispose() {}
  }
  env.replace('fetch', async (url, args) => {
    const index = ['learning', 'business', 'collaboration'].findIndex(name => url.includes(name));
    requests.push({ url, signal: args.signal, index });
    if (options.fetch) return options.fetch(index, args.signal);
    return { ok: options.failedIndex !== index, arrayBuffer: async () => new Uint8Array([index]).buffer };
  });
  const { createHumanScenes } = loadSource('src/lib/human-scenes.ts', {
    three: { ...THREE, WebGLRenderer: Renderer, PMREMGenerator: PMREM },
    'three/addons/loaders/GLTFLoader.js': { GLTFLoader: Loader },
    'three/addons/libs/meshopt_decoder.module.js': { MeshoptDecoder: decoder },
    'three/addons/environments/RoomEnvironment.js': { RoomEnvironment: class extends THREE.Scene { dispose() {} } },
  });
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { configurable: true, value: options.width ?? 1280 });
  Object.defineProperty(host, 'clientHeight', { value: options.height ?? 720 });
  host.getBoundingClientRect = () => ({ width: host.clientWidth, height: host.clientHeight, left: 0, top: 0 });
  document.body.appendChild(host);
  const controller = createHumanScenes(host, (index, ready) => statuses.push([index, ready]));
  env.cleanup(() => { controller.dispose(); host.remove(); });
  await settle();
  return { env, host, controller, assets, requests, statuses, renderer: instances[0], get parseCalls() { return parseCalls; }, get environmentDisposed() { return environmentDisposed; } };
}

test('all Three namespace exports used by the real runtime exist in the installed package', async () => {
  const source = ts.createSourceFile('human-scenes.ts', fs.readFileSync(path.join(project, 'src/lib/human-scenes.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
  const used = new Set();
  function visit(node) { if (ts.isPropertyAccessExpression(node) && node.expression.getText(source) === 'THREE') used.add(node.name.text); ts.forEachChild(node, visit); }
  visit(source);
  for (const name of used) assert.notEqual(THREE[name], undefined, `THREE.${name}`);
  assert.equal(typeof (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader, 'function');
  assert.equal(typeof (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment, 'function');
});

test('runtime loads the learning context first, then both different contexts, and scroll changes the rendered camera', async t => {
  const scene = await runtime(t);
  assert.deepEqual(scene.requests.map(request => request.url), ['/models/learning.glb', '/models/business.glb', '/models/collaboration.glb']);
  assert.deepEqual(scene.statuses, [[0, true], [1, true], [2, true]]);
  assert.equal(scene.parseCalls, 3);
  for (const progress of [0, 1, 2]) {
    scene.controller.setProgress(progress); scene.env.tick(70);
    const rendered = scene.renderer.renders.at(-1);
    assert.ok(rendered.contexts.includes(`context-${progress}`));
    assert.ok(Math.abs(rendered.camera.position.x - progress * 7.3) < .01, 'authored camera travels between spatially separated scenes');
    assert.ok(Number.isFinite(rendered.camera.fov));
  }
  scene.controller.setProgress(100); scene.env.tick(70);
  assert.ok(Math.abs(scene.renderer.renders.at(-1).camera.position.x - 14.6) < .01, 'scroll progress is clamped');
});

test('runtime really advances joint poses, pauses without an endless RAF, and suspends offscreen', async t => {
  const scene = await runtime(t);
  scene.env.tick(20); const before = scene.assets[0].bone.position.x;
  scene.env.tick(10); assert.notEqual(scene.assets[0].bone.position.x, before);
  scene.controller.pause(true); scene.env.tick(1);
  const paused = scene.assets[0].bone.position.x;
  assert.equal(scene.env.frames, 0); scene.env.tick(10); assert.equal(scene.assets[0].bone.position.x, paused);
  scene.controller.pause(false); scene.env.tick(3); assert.notEqual(scene.assets[0].bone.position.x, paused);
  scene.env.observers.intersection[0].callback([{ isIntersecting: false }]);
  assert.equal(scene.env.frames, 0);
  scene.env.observers.intersection[0].callback([{ isIntersecting: true }]);
  assert.equal(scene.env.frames, 1);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new window.Event('visibilitychange'));
  assert.equal(scene.env.frames, 0);
});

test('reduced motion snaps among contexts without a running RAF or gesture updates', async t => {
  const scene = await runtime(t, { reduced: true, width: 390, height: 844 });
  assert.equal(scene.env.frames, 0);
  const pose = scene.assets[0].bone.position.x;
  scene.controller.setProgress(1.7);
  assert.equal(scene.env.frames, 0);
  assert.ok(scene.renderer.renders.at(-1).contexts.includes('context-2'));
  scene.env.tick(10); assert.equal(scene.assets[0].bone.position.x, pose);
  const camera = scene.renderer.renders.at(-1).camera;
  assert.ok(camera.position.toArray().every(Number.isFinite)); assert.equal(camera.aspect, 390 / 844);
});

test('context loss aborts fetches, removes the canvas, disposes assets and observers exactly once', async t => {
  const scene = await runtime(t);
  const event = new window.Event('webglcontextlost', { cancelable: true });
  scene.renderer.domElement.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(scene.statuses.at(-1), [-1, false]);
  assert.ok(scene.requests.every(request => request.signal.aborted));
  assert.equal(scene.host.querySelector('canvas'), null);
  assert.equal(scene.renderer.disposed, 1); assert.equal(scene.environmentDisposed, 1);
  assert.equal(scene.env.frames, 0); assert.equal(scene.env.reduced.listenerCount, 0);
  assert.ok([...scene.env.observers.intersection, ...scene.env.observers.resize].every(observer => observer.disconnected));
  scene.assets.forEach(asset => assert.deepEqual(asset.disposal, { geometry: 1, material: 1, texture: 1 }));
  scene.controller.dispose(); scene.controller.setProgress(2); scene.controller.pause(false);
  assert.equal(scene.renderer.disposed, 1); assert.equal(scene.env.frames, 0);
});

test('disposing while fetch is pending aborts the request and suppresses late status updates', async t => {
  const pending = deferred();
  const scene = await runtime(t, { fetch: () => pending.promise });
  assert.equal(scene.requests.length, 1);
  scene.controller.dispose();
  assert.equal(scene.requests[0].signal.aborted, true);
  pending.reject(new DOMException('Cancelled', 'AbortError')); await settle();
  assert.deepEqual(scene.statuses, []); assert.equal(scene.requests.length, 1); assert.equal(scene.parseCalls, 0);
});

test('a model decoded after unmount is disposed without becoming visible or starting more fetches', async t => {
  const pending = deferred();
  const scene = await runtime(t, { parse: () => pending.promise });
  scene.controller.dispose(); pending.resolve(scene.assets[0]); await settle();
  assert.deepEqual(scene.assets[0].disposal, { geometry: 1, material: 1, texture: 1 });
  assert.deepEqual(scene.statuses, []); assert.equal(scene.requests.length, 1); assert.equal(scene.env.frames, 0);
});

test('one unavailable asset reports its fallback while other scenes can still load', async t => {
  const scene = await runtime(t, { failedIndex: 1 });
  assert.ok(scene.statuses.some(([index, ready]) => index === 1 && !ready));
  assert.ok(scene.statuses.some(([index, ready]) => index === 2 && ready));
  scene.controller.setProgress(2); scene.env.tick(70);
  assert.ok(scene.renderer.renders.at(-1).contexts.includes('context-2'));
});

test('frame-zero animation is applied before the first reduced-motion render and framing', async t => {
  const scene = await runtime(t, { reduced: true });
  assert.ok(scene.renderer.renders.length > 0);
  for (const asset of scene.assets) assert.equal(asset.bone.position.x, 0, 'authored pose replaces the differing unanimated rest pose');
  assert.equal(scene.env.frames, 0);
});

test('normal unmount disposes each real skeleton bone texture exactly once', async t => {
  const scene = await runtime(t);
  scene.controller.dispose(); scene.controller.dispose();
  for (const asset of scene.assets) assert.equal(asset.boneTextureDisposals, 1, 'Skeleton.dispose releases its GPU bone texture');
});


test('loading and animation preserve all authored scan texture maps and surface settings', async t => {
  const scene = await runtime(t);
  scene.controller.setProgress(2); scene.env.tick(70);
  for (const asset of scene.assets) {
    const material = asset.actor.material, original = asset.authoredMaterial;
    assert.equal(material, original.reference);
    for (const map of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) assert.equal(material[map], original[map], `${map} is retained`);
    assert.equal(material.color.getHex(), original.color);
    assert.equal(material.roughness, original.roughness);
    assert.equal(material.metalness, original.metalness);
    assert.deepEqual(material.normalScale.toArray(), original.normalScale);
  }
});

test('unmount closes each shared decoded image bitmap once, after disposing its textures', async t => {
  const scene = await runtime(t);
  class Bitmap { constructor() { this.closed = 0; } close() { this.closed++; } }
  scene.env.replace('ImageBitmap', Bitmap);
  const images = scene.assets.map(asset => {
    const pixels = new Bitmap(); asset.actor.material.map.source.data = pixels; return pixels;
  });
  scene.controller.dispose(); scene.controller.dispose();
  assert.deepEqual(images.map(image => image.closed), [1, 1, 1]);
});


test('short-landscape phones frame the posed scene inside their narrow canvas band', async t => {
  const scene = await runtime(t, { reduced: true, width: 844, height: 390 });
  Object.defineProperty(scene.host, 'clientWidth', { configurable: true, value: 447 });
  scene.env.observers.resize[0].callback();
  scene.controller.setProgress(2);
  const camera = scene.renderer.renders.at(-1).camera;
  const center = new THREE.Box3().setFromObject(scene.assets[2].scene).getCenter(new THREE.Vector3()).project(camera);
  assert.ok(Math.abs(center.x) < .001 && Math.abs(center.y) < .001, 'compact layout centers the actual first pose');
  assert.equal(camera.aspect, 447 / 390);
  assert.equal(scene.env.frames, 0);
});

test('phone viewports choose the 1024px mobile tier once and do not reload on resize', async t => {
  const scene = await runtime(t, { width: 390, height: 844 });
  assert.deepEqual(scene.requests.map(request => request.url), ['/models/learning-mobile.glb', '/models/business-mobile.glb', '/models/collaboration-mobile.glb']);
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
  scene.env.observers.resize[0].callback(); scene.env.tick(2);
  assert.equal(scene.requests.length, 3, 'no desktop asset replacement on resize');
  assert.equal(scene.parseCalls, 3);
});

test('short-landscape phones also choose mobile assets despite a width above 800px', async t => {
  const scene = await runtime(t, { width: 844, height: 390 });
  assert.ok(scene.requests.every(request => request.url.endsWith('-mobile.glb')));
});


test('desktop framing matches the exported 1440×900 camera instead of assuming 16:9', async t => {
  const scene = await runtime(t, { reduced: true, width: 1440, height: 900, authoredAspect: 1.6 });
  for (const progress of [0, 1, 2]) {
    scene.controller.setProgress(progress);
    assert.ok(Math.abs(scene.renderer.renders.at(-1).camera.fov - 35) < .00001, 'native aspect preserves authored field of view');
  }
  Object.defineProperty(scene.host, 'clientWidth', { configurable: true, value: 1100 });
  scene.env.observers.resize[0].callback();
  const expected = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(35) / 2) * 1.6 / (1100 / 900)));
  assert.ok(Math.abs(scene.renderer.renders.at(-1).camera.fov - expected) < .00001, 'narrower viewports preserve horizontal framing');
});


test('sunset lighting has a dominant directional key with restrained ambient/fill and matte floor', async t => {
  const result = await runtime(t);
  const world = result.renderer.lastScene;
  const directions = world.children.filter(object => object.isDirectionalLight).sort((a, b) => b.intensity - a.intensity);
  const hemisphere = world.children.find(object => object.isHemisphereLight);
  assert.equal(directions.length, 3);
  assert.ok(directions[0].castShadow);
  assert.ok(directions[0].intensity > 5 * directions[2].intensity);
  assert.ok(hemisphere.intensity <= .6 && world.environmentIntensity <= .4);
  assert.ok(directions[0].position.x < directions[0].target.position.x, 'key arrives from one side');
  assert.ok(result.renderer.toneMappingExposure <= 1.05, 'avoid the prior exposure wash');
  const floor = world.children.find(object => object.isMesh && object.geometry.type === 'PlaneGeometry');
  assert.ok(floor.material.roughness >= .8 && floor.material.metalness === 0);
});
