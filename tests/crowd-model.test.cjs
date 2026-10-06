const { test } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { project, loadSource } = require('./helpers.cjs');
const { createCrowdModel, poseCrowd, CROWD_PALETTE } = loadSource('src/lib/crowd-model.ts');
const distance = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));
function transforms(model) {
  const values = [];
  model.root.traverse(o => values.push(...o.position.toArray(), ...o.quaternion.toArray(), ...o.scale.toArray()));
  return values;
}

test('crowd is seven original full-depth rounded figures supporting a low-poly rock', () => {
  const model = createCrowdModel();
  assert.equal(model.actors.length, 7);
  assert.equal(new Set(model.actors.map(a => a.hipHeight + a.torsoHeight)).size, 7);
  assert.ok(model.actors.some(a => a.origin[2] < -.4));
  assert.ok(model.actors.some(a => a.origin[2] > .6));
  assert.equal(CROWD_PALETTE.paper, '#F4F3EF');
  assert.equal(CROWD_PALETTE.ink, '#14140F');
  const names = new Set();
  let triangles = 0;
  model.root.traverse(o => {
    names.add(o.name);
    if (!(o instanceof THREE.Mesh)) return;
    triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));
    assert.equal(Object.values(o.material).some(v => v instanceof THREE.Texture), false);
  });
  assert.ok(triangles < 45000, `${triangles} triangles, including ink contours`);
  for (const name of ['large-irregular-stone', 'continuous-bean-torso', 'tiny-ink-eye', 'planted-rounded-foot', 'supporting-palm-thumb']) assert.ok(names.has(name), name);
  const box = new THREE.Box3().setFromObject(model.root);
  const size = box.getSize(new THREE.Vector3());
  assert.ok(size.x > 3.8 && size.x < 4.3);
  assert.ok(size.y > 3.7 && size.y < 4.1);
  assert.ok(size.z > 1.9, 'the crowd and boulder occupy genuine depth');
  assert.ok(box.min.y > -.005);
  model.dispose();
});

test('support uses fixed-length IK with continuous joints, planted feet and palms on the moving rock', () => {
  const model = createCrowdModel();
  const feet = model.actors.flatMap(a => a.feet.map(f => f.position.toArray()));
  const limbScales = model.actors.flatMap(a => [...a.arms, ...a.legs].flatMap(c => [c.upper.scale.toArray(), c.lower.scale.toArray()]));
  for (const time of [0, .4, 1.7, 3.9, 19, 70]) {
    for (const lift of [0, .5, 1]) {
      for (const effort of [0, 1]) {
        poseCrowd(model, { time, lift, effort, pointerX: Math.sin(time), pointerY: .5 });
        model.root.updateMatrixWorld(true);
        for (const actor of model.actors) {
          for (const chain of [...actor.arms, ...actor.legs]) {
            assert.ok(Math.abs(distance(chain.start, chain.bend) - chain.upperLength) < 1e-7);
            assert.ok(Math.abs(distance(chain.bend, chain.target) - chain.lowerLength) < 1e-7, `unreachable ${actor.root.name} at lift ${lift}, time ${time}`);
            assert.ok(distance(chain.joint.position.toArray(), chain.bend) < 1e-7);
            assert.ok(distance(chain.end.position.toArray(), chain.target) < 1e-7);
          }
          actor.arms.forEach((arm, i) => {
            const anchor = new THREE.Vector3(...actor.anchors[i]).applyMatrix4(model.rock.matrixWorld);
            const palm = arm.end.getWorldPosition(new THREE.Vector3());
            assert.ok(anchor.distanceTo(palm) < 1e-7, 'palms stay at the shared rock anchors');
          });
        }
        assert.deepEqual(model.actors.flatMap(a => a.feet.map(f => f.position.toArray())), feet);
        assert.deepEqual(model.actors.flatMap(a => [...a.arms, ...a.legs].flatMap(c => [c.upper.scale.toArray(), c.lower.scale.toArray()])), limbScales);
      }
    }
  }
  model.dispose();
});

test('pose input is bounded, absolute, nonuniform and reduced motion freezes decorative movement', () => {
  const model = createCrowdModel();
  poseCrowd(model, { time: .42, effort: .2, lift: .3 });
  const expected = transforms(model);
  for (const time of [1, 200, NaN, Infinity]) {
    poseCrowd(model, { time, effort: 100, lift: Infinity, pointerX: NaN, pointerY: -100 });
    assert.ok(transforms(model).every(Number.isFinite));
  }
  poseCrowd(model, { time: .42, effort: .2, lift: .3 });
  assert.deepEqual(transforms(model), expected);
  poseCrowd(model, { time: 0, reducedMotion: true, effort: .4, lift: .4 });
  const still = transforms(model);
  poseCrowd(model, { time: 900, pointerX: 1, pointerY: -1, reducedMotion: true, effort: .4, lift: .4 });
  assert.deepEqual(transforms(model), still);
  poseCrowd(model, { time: 1.2, effort: 1, lift: 1 });
  assert.ok(model.rock.position.y <= 2.68);
  const movements = model.actors.map(a => a.body.position.y - a.hipHeight);
  assert.ok(new Set(movements.map(n => n.toFixed(4))).size > 3);
  const histories = model.actors.map(() => ({ y: [], glance: [], lean: [] }));
  for (let i = 0; i < 150; i++) {
    poseCrowd(model, { time: i * .05, effort: 0, lift: 0 });
    model.actors.forEach((actor, j) => {
      histories[j].y.push(actor.body.position.y);
      histories[j].glance.push(actor.head.rotation.y);
      histories[j].lean.push(actor.body.rotation.z);
    });
  }
  const span = values => Math.max(...values) - Math.min(...values);
  for (const history of histories) {
    assert.ok(span(history.y) >= .08 && span(history.y) < .10, 'readable bracing and recovery');
    assert.ok(span(history.glance) > .20, 'a deliberate neighbor glance');
    assert.ok(span(history.lean) > .10, 'a readable change of balance');
  }
  assert.notDeepEqual(histories[0].y, histories[1].y, 'staggered beats, rather than uniform bobbing');
  model.dispose();
});

test('all shared geometries and materials are disposed once, even when dispose repeats', () => {
  const model = createCrowdModel();
  const resources = new Set();
  model.root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    resources.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) resources.add(m);
  });
  const calls = new Map([...resources].map(r => [r, 0]));
  resources.forEach(r => r.addEventListener('dispose', () => calls.set(r, calls.get(r) + 1)));
  model.dispose(); model.dispose();
  assert.ok([...calls.values()].every(n => n === 1));
});

test('crowd uses only installed Three APIs and contains no external asset loading', () => {
  const filename = path.join(project, 'src/lib/crowd-model.ts');
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
  const used = new Set();
  function visit(node) {
    if (ts.isPropertyAccessExpression(node) && node.expression.getText(source) === 'THREE') used.add(node.name.text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  used.forEach(name => assert.notEqual(THREE[name], undefined, `THREE.${name}`));
  assert.doesNotMatch(source.text, /\bfetch\s*\(|GLTFLoader|TextureLoader|https?:\/\//);
});

test('bracing and glance extrema cannot overextend a support limb', () => {
  const model = createCrowdModel();
  for (let i = 0; i < 600; i++) {
    poseCrowd(model, {
      time: i * .173,
      effort: (i % 3) / 2,
      lift: (i % 5) / 4,
      pointerX: i % 2 ? -1 : 1,
      pointerY: i % 2 ? 1 : -1,
    });
    for (const actor of model.actors) {
      for (const chain of [...actor.arms, ...actor.legs]) {
        assert.ok(Math.abs(distance(chain.bend, chain.target) - chain.lowerLength) < 1e-7);
        assert.ok(Math.abs(distance(chain.start, chain.bend) - chain.upperLength) < 1e-7);
      }
    }
  }
  model.dispose();
});
