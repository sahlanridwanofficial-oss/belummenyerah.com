const { test } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { project, loadSource } = require('./helpers.cjs');
const { createBekalModel, poseBekal, BEKAL_PALETTE } = loadSource('src/lib/bekal-model.ts');

test('Bekal is original low-poly Three geometry with an actual fold, face, spine, tote, and shoes', () => {
  const model = createBekalModel();
  const names = new Set();
  let triangles = 0, meshes = 0;
  model.root.traverse(object => {
    names.add(object.name);
    if (object instanceof THREE.Mesh) {
      meshes++;
      triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
      assert.equal(Object.values(object.material).some(value => value instanceof THREE.Texture), false);
      assert.ok(Array.from(object.geometry.attributes.position.array).every(Number.isFinite));
    }
  });
  for (const name of ['yellow-beveled-cover', 'turned-down-paper-corner', 'rounded-binding-spine', 'black-oval-eye', 'quiet-curved-smile', 'cream-canvas-tote', 'left-chunky-shoe', 'right-chunky-shoe']) assert.ok(names.has(name), name);
  assert.ok(meshes > 20);
  assert.ok(triangles < 30000, `${triangles} triangles`);
  assert.equal(BEKAL_PALETTE.yellow, '#F5CE58');
  const bounds = new THREE.Box3().setFromObject(model.root);
  const size = bounds.getSize(new THREE.Vector3());
  assert.ok(size.y > 2.8 && size.y < 3.1);
  assert.ok(size.z > .8, 'the mascot has genuine depth');
  assert.ok(bounds.min.y > -.01, 'the soles rest above the ground');
  model.dispose();
});

test('poses are bounded, deterministic and reduced motion stays still', () => {
  const model = createBekalModel();
  const transforms = () => {
    const values = [];
    model.root.traverse(object => values.push(...object.position.toArray(), ...object.scale.toArray(), object.rotation.x, object.rotation.y, object.rotation.z));
    return values;
  };
  poseBekal(model, { time: 0 });
  const initial = transforms();
  for (const time of [0, .3, .85, 1.4, 1.8, 4.95, 100, NaN]) {
    poseBekal(model, { time, pointerX: Infinity, pointerY: -100, progress: 100, celebration: time });
    assert.ok(transforms().every(Number.isFinite));
    assert.ok(model.root.position.y <= .31);
  }
  poseBekal(model, { time: 0 });
  assert.deepEqual(transforms(), initial, 'absolute poses cannot accumulate drift');
  poseBekal(model, { time: 3, pointerX: 1, celebration: .4, reducedMotion: true });
  const reduced = transforms();
  poseBekal(model, { time: 999, pointerX: -1, celebration: .8, reducedMotion: true });
  assert.deepEqual(transforms(), reduced);
  poseBekal(model, { time: .4, celebration: .4 });
  assert.ok(model.root.position.y > .25);
  assert.ok(model.leftArm.rotation.z < -1);
  model.dispose();
});

test('shared geometries and materials are disposed exactly once', () => {
  const model = createBekalModel();
  const resources = new Set();
  model.root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    resources.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) resources.add(material);
  });
  const counts = new Map([...resources].map(resource => [resource, 0]));
  for (const resource of resources) resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
  model.dispose(); model.dispose();
  assert.ok([...counts.values()].every(count => count === 1));
});

test('all Three namespace APIs used by Bekal exist in installed Three r180', () => {
  for (const file of ['bekal-model.ts', 'bekal-scene.ts']) {
    const source = ts.createSourceFile(file, fs.readFileSync(path.join(project, 'src/lib', file), 'utf8'), ts.ScriptTarget.Latest, true);
    const used = new Set();
    function visit(node) {
      if (ts.isPropertyAccessExpression(node) && node.expression.getText(source) === 'THREE') used.add(node.name.text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const name of used) assert.notEqual(THREE[name], undefined, `THREE.${name}`);
    assert.doesNotMatch(source.text, /\bfetch\s*\(|GLTFLoader|TextureLoader|<video/);
  }
});
