const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { project } = require('./helpers.cjs');
const names = ['learning', 'business', 'collaboration'];
const variants = names.flatMap(name => [{ name, key: name, mobile: false }, { name, key: `${name}-mobile`, mobile: true }]);
const assets = new Map();
let THREE;
const original = new Map();

function webp(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
}

function webpDimensions(bytes) {
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4), data = offset + 8;
    if (type === 'VP8X') return [bytes.readUIntLE(data + 4, 3) + 1, bytes.readUIntLE(data + 7, 3) + 1];
    if (type === 'VP8 ') return [bytes.readUInt16LE(data + 6) & 0x3fff, bytes.readUInt16LE(data + 8) & 0x3fff];
    if (type === 'VP8L') {
      const dimensions = bytes.readUInt32LE(data + 1);
      return [(dimensions & 0x3fff) + 1, ((dimensions >>> 14) & 0x3fff) + 1];
    }
    offset = data + size + (size % 2);
  }
  throw new Error('WebP image dimensions missing');
}

before(async () => {
  THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
  // GLTFLoader, Meshopt, geometry, skins, animation and cameras are real.
  // Node has no image decoder: bitmap pixels are deliberately NOT visually tested.
  for (const [key, value] of Object.entries({
    self: globalThis,
    createImageBitmap: async () => ({ width: 4, height: 4, close() {} }),
    ProgressEvent: class { constructor(type, properties) { Object.assign(this, properties); this.type = type; } },
  })) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  await MeshoptDecoder.ready;
  for (const { key } of variants) {
    const bytes = fs.readFileSync(path.join(project, 'public/models', `${key}.glb`));
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
    const jsonEnd = 20 + bytes.readUInt32LE(12);
    const json = JSON.parse(bytes.toString('utf8', 20, jsonEnd));
    assert.equal(bytes.readUInt32LE(jsonEnd + 4), 0x004e4942);
    const binary = bytes.subarray(jsonEnd + 8);
    assert.equal(binary.length, bytes.readUInt32LE(jsonEnd));
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), '');
    gltf.scene.updateMatrixWorld(true);
    assets.set(key, { bytes, json, binary, gltf });
  }
});
after(() => {
  for (const { gltf } of assets.values()) gltf.scene.traverse(object => {
    object.geometry?.dispose();
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    for (const material of materials) { for (const value of Object.values(material)) if (value?.isTexture) value.dispose(); material.dispose(); }
    object.skeleton?.dispose();
  });
  for (const [key, descriptor] of original) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

test('three detailed scenes ship as desktop/mobile GLBs with matching WebP fallbacks', () => {
  const hashes = new Set(), posterHashes = new Set();
  const contexts = [/Learning|Learner|Guide|Student|Laptop/i, /Business|ProductLabeler|OrderPacker|Seller|Parcel|Order/i, /Collaboration|PlanningPartner|BusinessFounder|Planning/i];
  variants.forEach(({ name, key, mobile }) => {
    const index = names.indexOf(name);
    const { bytes, json, binary } = assets.get(key);
    hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
    assert.equal(json.asset.version, '2.0');
    assert.match(json.nodes.map(node => node.name ?? '').join(' '), contexts[index]);
    assert.ok(json.buffers.every(buffer => !buffer.uri), 'no remote buffer dependency');
    assert.ok(json.images.every(image => image.bufferView !== undefined && !image.uri), 'textures embedded');
    for (const extension of ['EXT_meshopt_compression', 'EXT_texture_webp']) assert.ok(json.extensionsRequired.includes(extension));
    const compressed = json.bufferViews.filter(view => view.extensions?.EXT_meshopt_compression);
    assert.ok(compressed.length > 0);
    for (const view of compressed) {
      const ext = view.extensions.EXT_meshopt_compression;
      assert.ok(ext.count > 0 && ext.byteStride > 0);
      assert.ok((ext.byteOffset ?? 0) + ext.byteLength <= binary.length);
    }
    for (const image of json.images) {
      assert.equal(image.mimeType, 'image/webp');
      const view = json.bufferViews[image.bufferView];
      const pixels = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
      webp(pixels);
      const [width, height] = webpDimensions(pixels);
      const textureBudget = mobile ? 1024 : 2048;
      assert.ok(width <= textureBudget && height <= textureBudget, `${key} texture ${width}×${height} exceeds ${textureBudget}px budget`);
    }
    for (const texture of json.textures) assert.ok(json.images[texture.extensions.EXT_texture_webp.source]);
    const poster = fs.readFileSync(path.join(project, 'public/scenes', `${name}.webp`));
    webp(poster); posterHashes.add(crypto.createHash('sha256').update(poster).digest('hex'));
  });
  assert.equal(hashes.size, 6); assert.equal(posterHashes.size, 3);
});

for (const { name, key } of variants) {
  test(`${key}: real loader decodes detailed skinned actors with usable camera framing`, () => {
    const { gltf } = assets.get(key);
    const actors = new Set(), skinned = [];
    gltf.scene.traverse(object => { if (object.isSkinnedMesh) { actors.add(object.skeleton.bones[0]); skinned.push(object); } });
    assert.equal(actors.size, name === 'learning' ? 3 : 2, 'expected independently rigged scan actors');
    let vertices = 0;
    for (const mesh of skinned) {
      const position = mesh.geometry.getAttribute('position');
      vertices += position.count;
      assert.equal(mesh.skeleton.bones.length, 89, 'original detailed scan rig');
      assert.equal(mesh.geometry.getAttribute('skinIndex').count, position.count);
      assert.equal(mesh.geometry.getAttribute('skinWeight').count, position.count);
      assert.ok([...position.array].every(Number.isFinite));
      assert.equal(mesh.skeleton.bones.length, mesh.skeleton.boneInverses.length);
    }
    assert.ok(vertices >= actors.size * 10000, 'at least 10,000 detailed scan vertices per actor');
    assert.ok(skinned.every(mesh => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).every(material => material.map && material.normalMap)), 'all scan meshes retain amber detail maps and original normal maps');
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    assert.ok(!bounds.isEmpty());
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok(size.x > 1 && size.y > 1 && size.z > .5);
    const camera = gltf.cameras[0];
    assert.ok(camera.isPerspectiveCamera && camera.fov > 10 && camera.fov < 80);
    camera.updateMatrixWorld(true);
    const projected = bounds.getCenter(new THREE.Vector3()).project(camera);
    assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z > -1 && projected.z < 1, `center in authored camera frustum: ${projected.toArray()}`);
  });

  test(`${key}: real AnimationMixer changes joint poses, with finite timed motion keyframes`, () => {
    const { gltf } = assets.get(key);
    assert.ok(gltf.animations.length >= 2);
    const bones = [];
    gltf.scene.traverse(object => { if (object.isBone) bones.push(object); });
    let variableTracks = 0;
    for (const clip of gltf.animations) {
      assert.ok(clip.duration > 1);
      for (const track of clip.tracks) {
        assert.ok(track.times.length >= 2);
        assert.ok([...track.times, ...track.values].every(Number.isFinite));
        for (let i = 1; i < track.times.length; i++) assert.ok(track.times[i] >= track.times[i - 1]);
        const stride = track.getValueSize();
        if ([...track.values].some((value, i) => Math.abs(value - track.values[i % stride]) > .0001)) variableTracks++;
      }
    }
    assert.ok(variableTracks > 0, 'animation clips contain changing values, not just bind-pose keys');
    const mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
    mixer.setTime(.1); gltf.scene.updateMatrixWorld(true);
    const before = bones.map(bone => bone.matrixWorld.clone());
    mixer.setTime(1.4); gltf.scene.updateMatrixWorld(true);
    const changed = bones.filter((bone, i) => bone.matrixWorld.elements.some((value, j) => Math.abs(value - before[i].elements[j]) > .00001));
    assert.ok(changed.length > 0, 'bone world matrices really move');
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
  });
}


for (const name of names) {
  test(`${name}: mobile preserves desktop rigs, geometry, cameras and motion`, () => {
    function signature(gltf) {
      const meshes = [];
      gltf.scene.traverse(object => {
        if (object.isSkinnedMesh) meshes.push({ vertices: object.geometry.getAttribute('position').count, bones: object.skeleton.bones.length });
      });
      return {
        meshes,
        cameras: gltf.cameras.map(camera => ({ fov: camera.fov, near: camera.near, far: camera.far })),
        clips: gltf.animations.map(clip => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.length })),
      };
    }
    assert.deepEqual(signature(assets.get(`${name}-mobile`).gltf), signature(assets.get(name).gltf));
  });
}


test('all six exports encode orange satin and paler resin materials, never neutral photographic skin/clothing', () => {
  for (const { key } of variants) {
    const { json } = assets.get(key);
    const materials = json.materials.filter(material => material.name?.startsWith('BM_'));
    assert.equal(materials.length, key.startsWith('learning') ? 6 : 4);
    for (const material of materials) {
      const pbr = material.pbrMetallicRoughness;
      const color = pbr.baseColorFactor;
      assert.ok(color && color[0] > color[1] && color[1] > color[2], `${key}/${material.name} must encode amber, not grayscale`);
      assert.ok(pbr.baseColorTexture && material.normalTexture);
      if (material.name.endsWith('frosted_skin_hair')) {
        assert.ok(pbr.roughnessFactor >= .15 && pbr.roughnessFactor <= .26);
        assert.ok(material.extensions.KHR_materials_clearcoat.clearcoatFactor > .5);
        assert.ok(material.extensions.KHR_materials_transmission.transmissionFactor > 0);
      } else {
        assert.ok(pbr.roughnessFactor >= .28 && pbr.roughnessFactor <= .4);
      }
    }
  }
});

test('authored first-pose figures touch the floor, including both seated learners', () => {
  for (const { key } of variants) {
    const { gltf } = assets.get(key);
    const mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
    mixer.setTime(0); gltf.scene.updateMatrixWorld(true);
    const floors = new Map();
    gltf.scene.traverse(mesh => {
      if (!mesh.isSkinnedMesh) return;
      mesh.skeleton.update(); mesh.computeBoundingBox();
      const box = mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
      const actor = mesh.skeleton.bones[0];
      floors.set(actor, Math.min(floors.get(actor) ?? Infinity, box.min.y));
    });
    for (const min of floors.values()) assert.ok(min > -.04 && min < .08, `${key}: actor lowest point ${min} must sit on the stage`);
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
  }
});
