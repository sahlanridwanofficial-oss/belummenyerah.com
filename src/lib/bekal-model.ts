import * as THREE from "three";

/** Bekal is built only from our own shapes. No downloaded meshes or textures. */
export const BEKAL_PALETTE = {
  yellow: "#F5CE58",
  fold: "#FFE493",
  spine: "#D5A333",
  ink: "#14140F",
  paper: "#F4F3EF",
  seam: "#C39A40",
} as const;

export type BekalModel = {
  root: THREE.Group;
  body: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftShoe: THREE.Group;
  rightShoe: THREE.Group;
  eyes: THREE.Group;
  tote: THREE.Group;
  dispose: () => void;
};

export type BekalPose = {
  time: number;
  pointerX?: number;
  pointerY?: number;
  progress?: number;
  /** Elapsed seconds since a celebration, or -1 for the resting pose. */
  celebration?: number;
  reducedMotion?: boolean;
};

const clamp = (value: number, low: number, high: number) =>
  Number.isFinite(value) ? Math.min(high, Math.max(low, value)) : 0;

function roundedShape(width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  return new THREE.Shape()
    .moveTo(x + radius, y)
    .lineTo(x + width - radius, y)
    .quadraticCurveTo(x + width, y, x + width, y + radius)
    .lineTo(x + width, y + height - radius)
    .quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    .lineTo(x + radius, y + height)
    .quadraticCurveTo(x, y + height, x, y + height - radius)
    .lineTo(x, y + radius)
    .quadraticCurveTo(x, y, x + radius, y);
}

function panelGeometry(shape: THREE.Shape, depth: number, bevel = 0.055) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/**
 * Geometry remains deliberately inspectable. The paper body, inset face,
 * spine, folded corner, stitched tote and flexible limbs are separate meshes.
 */
export function createBekalModel(): BekalModel {
  const root = new THREE.Group();
  root.name = "bekal-original-mascot";
  const body = new THREE.Group();
  body.name = "folded-paper-body";
  body.position.y = 1.79;
  root.add(body);

  const yellow = new THREE.MeshPhysicalMaterial({
    color: BEKAL_PALETTE.yellow, roughness: 0.43, metalness: 0,
    clearcoat: 0.22, clearcoatRoughness: 0.46,
  });
  const ink = new THREE.MeshPhysicalMaterial({
    color: BEKAL_PALETTE.ink, roughness: 0.38, metalness: 0,
    clearcoat: 0.15, clearcoatRoughness: 0.45,
  });
  const eyesMaterial = new THREE.MeshPhysicalMaterial({
    color: BEKAL_PALETTE.ink, roughness: 0.22, metalness: 0,
    clearcoat: 0.45, clearcoatRoughness: 0.24,
  });
  const paper = new THREE.MeshStandardMaterial({ color: BEKAL_PALETTE.paper, roughness: 0.8 });
  const foldMaterial = new THREE.MeshPhysicalMaterial({
    color: BEKAL_PALETTE.fold, roughness: 0.5, clearcoat: 0.1,
  });
  const spineMaterial = new THREE.MeshStandardMaterial({ color: BEKAL_PALETTE.spine, roughness: 0.58 });
  const seamMaterial = new THREE.MeshStandardMaterial({ color: BEKAL_PALETTE.seam, roughness: 0.8 });
  const soleMaterial = new THREE.MeshStandardMaterial({ color: "#30302A", roughness: 0.75 });
  const unitSphere = new THREE.SphereGeometry(1, 24, 16);

  function mesh(
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    x = 0, y = 0, z = 0,
  ) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function pebble(
    name: string, parent: THREE.Object3D, material: THREE.Material,
    position: [number, number, number], size: [number, number, number],
  ) {
    const object = mesh(name, unitSphere, material, parent, ...position);
    object.scale.set(...size);
    return object;
  }
  function tube(
    name: string, points: [number, number, number][], radius: number,
    material: THREE.Material, parent: THREE.Object3D, segments = 22,
  ) {
    return mesh(name, new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
      segments, radius, 8, false,
    ), material, parent);
  }

  // A real clipped corner defines the silhouette, rather than a flat decal.
  const bodyShape = new THREE.Shape()
    .moveTo(-0.87, -1.02)
    .lineTo(0.84, -1.02)
    .quadraticCurveTo(0.98, -1.02, 0.98, -0.88)
    .lineTo(0.98, 0.52)
    .quadraticCurveTo(0.98, 0.58, 0.92, 0.64)
    .lineTo(0.5, 1.06)
    .quadraticCurveTo(0.46, 1.1, 0.4, 1.1)
    .lineTo(-0.87, 1.1)
    .quadraticCurveTo(-1.01, 1.1, -1.01, 0.96)
    .lineTo(-1.01, -0.88)
    .quadraticCurveTo(-1.01, -1.02, -0.87, -1.02);
  mesh("yellow-beveled-cover", panelGeometry(bodyShape, 0.5, 0.075), yellow, body);

  // The warm binding edge and quiet page block read as a pocket-sized book.
  const pageBlock = mesh("paper-page-block", panelGeometry(bodyShape, 0.15, 0.035), paper, body, 0.025, -0.025, -0.30);
  pageBlock.scale.set(0.96, 0.96, 1);
  mesh("rounded-binding-spine", panelGeometry(roundedShape(0.14, 1.9, 0.055), 0.54, 0.035), spineMaterial, body, -0.975, 0.025, -0.025);
  // Two small visible page edges, kept geometric and subtle.
  for (const y of [-0.86, -0.80]) {
    tube("page-edge", [[0.86, y, -0.4], [0.86, y, -0.23]], 0.009, seamMaterial, body, 2);
  }

  const foldedCorner = new THREE.Shape()
    .moveTo(0.39, 1.005)
    .lineTo(0.86, 0.54)
    .lineTo(0.49, 0.54)
    .quadraticCurveTo(0.39, 0.54, 0.39, 0.64)
    .lineTo(0.39, 1.005);
  mesh("turned-down-paper-corner", panelGeometry(foldedCorner, 0.075, 0.027), foldMaterial, body, 0, 0, 0.32);
  tube("fold-shadow-seam", [[0.39, 0.99, 0.3], [0.39, 0.65, 0.315], [0.43, 0.55, 0.32], [0.84, 0.54, 0.315]], 0.015, seamMaterial, body, 18);

  const eyes = new THREE.Group();
  eyes.name = "expressive-inset-eyes";
  body.add(eyes);
  for (const x of [-0.37, 0.29]) {
    pebble("eye-inset-rim", body, spineMaterial, [x, 0.15, 0.312], [0.143, 0.209, 0.028]);
    pebble("black-oval-eye", eyes, eyesMaterial, [x, 0.154, 0.332], [0.112, 0.176, 0.054]);
  }
  tube("quiet-curved-smile", [[-0.22, -0.29, 0.337], [-0.13, -0.365, 0.351], [0.0, -0.382, 0.355], [0.13, -0.36, 0.351], [0.22, -0.265, 0.337]], 0.025, ink, body, 24);
  // Short, softly raised corners give the smile a friendly, hand-made finish.
  pebble("smile-left-tip", body, ink, [-0.22, -0.29, 0.337], [0.025, 0.025, 0.025]);
  pebble("smile-right-tip", body, ink, [0.22, -0.265, 0.337], [0.025, 0.025, 0.025]);

  const leftArm = new THREE.Group();
  leftArm.name = "waving-arm";
  leftArm.position.set(-1.01, -0.12, 0.015);
  body.add(leftArm);
  tube("left-flexible-arm", [[0, 0, 0], [-0.27, -0.12, 0.01], [-0.36, -0.37, 0.065], [-0.31, -0.64, 0.105]], 0.073, ink, leftArm);
  pebble("left-mitten", leftArm, ink, [-0.3, -0.69, 0.11], [0.14, 0.16, 0.12]);
  pebble("left-thumb", leftArm, ink, [-0.195, -0.65, 0.13], [0.07, 0.10, 0.09]);

  const rightArm = new THREE.Group();
  rightArm.name = "carrying-arm";
  rightArm.position.set(1.01, -0.14, 0.02);
  body.add(rightArm);
  tube("right-flexible-arm", [[0, 0, 0], [0.27, -0.13, 0.04], [0.32, -0.41, 0.12], [0.26, -0.57, 0.17]], 0.073, ink, rightArm);

  const tote = new THREE.Group();
  tote.name = "small-business-tote";
  tote.position.set(0.27, -0.9, 0.08);
  tote.rotation.z = -0.07;
  rightArm.add(tote);
  mesh("cream-canvas-tote", panelGeometry(roundedShape(0.64, 0.61, 0.07), 0.2, 0.045), paper, tote);
  tube("tote-back-handle", [[-0.18, 0.27, -0.07], [-0.16, 0.55, -0.07], [0.02, 0.59, -0.07], [0.18, 0.5, -0.07], [0.19, 0.28, -0.07]], 0.025, seamMaterial, tote);
  tube("tote-front-handle", [[-0.18, 0.27, 0.14], [-0.15, 0.52, 0.14], [0.02, 0.56, 0.14], [0.18, 0.48, 0.14], [0.19, 0.28, 0.14]], 0.025, paper, tote);
  // An original modest ascending mark, embossed as three geometric stitches.
  for (let i = 0; i < 3; i++) {
    mesh(`tote-progress-stitch-${i + 1}`, panelGeometry(roundedShape(0.047, 0.065 + i * 0.049, 0.018), 0.008, 0.005), spineMaterial, tote, -0.087 + i * 0.087, -0.033 + i * 0.0245, 0.153);
  }
  pebble("right-mitten", rightArm, ink, [0.26, -0.57, 0.19], [0.13, 0.145, 0.12]);
  pebble("right-thumb", rightArm, ink, [0.17, -0.52, 0.24], [0.073, 0.095, 0.07]);

  const leftShoe = new THREE.Group();
  const rightShoe = new THREE.Group();
  for (const [shoe, x, yaw] of [[leftShoe, -0.48, -0.16], [rightShoe, 0.45, 0.18]] as const) {
    shoe.name = x < 0 ? "left-chunky-shoe" : "right-chunky-shoe";
    shoe.position.set(x, 0.17, 0.015);
    shoe.rotation.y = yaw;
    root.add(shoe);
    tube("short-flexible-leg", [[0, 0.08, -0.05], [0, 0.34, -0.055], [x < 0 ? -0.035 : 0.025, 0.64, -0.04]], 0.105, ink, shoe, 12);
    const sole = mesh("shoe-flat-sole", panelGeometry(roundedShape(0.62, 0.78, 0.20), 0.09, 0.035), soleMaterial, shoe, 0, -0.065, 0.09);
    sole.rotation.x = -Math.PI / 2;
    // A pill-like toe, squared by its discreet molded sole.
    pebble("rounded-shoe-upper", shoe, ink, [0, 0.065, 0.14], [0.305, 0.205, 0.40]);
  }

  let disposed = false;
  const model: BekalModel = {
    root, body, leftArm, rightArm, leftShoe, rightShoe, eyes, tote,
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
  poseBekal(model, { time: 0 });
  return model;
}

/** Deterministic absolute transforms prevent drift after pause/resume or clicks. */
export function poseBekal(model: BekalModel, pose: BekalPose) {
  const reduced = pose.reducedMotion ?? false;
  const time = reduced ? 0 : Math.max(0, Number.isFinite(pose.time) ? pose.time : 0);
  const px = reduced ? 0 : clamp(pose.pointerX ?? 0, -1, 1);
  const py = reduced ? 0 : clamp(pose.pointerY ?? 0, -1, 1);
  const progress = clamp(pose.progress ?? 0, 0, 1);
  const elapsed = Number.isFinite(pose.celebration) ? pose.celebration! : -1;
  const celebrating = !reduced && elapsed >= 0 && elapsed < 1.8;
  const envelope = celebrating ? Math.sin(Math.PI * Math.min(elapsed / 1.8, 1)) : 0;
  const hop = celebrating && elapsed < 0.85 ? Math.sin(Math.PI * elapsed / 0.85) * 0.31 : 0;
  const breath = Math.sin(time * 1.65) * 0.014;
  const lean = Math.sin(time * 0.73) * 0.012;

  model.root.position.y = hop;
  model.root.rotation.set(py * 0.025, -0.20 + px * 0.14 + progress * 0.12, -0.025 + lean + px * -0.017);
  model.body.position.y = 1.79 + breath;
  model.body.rotation.z = envelope * 0.04;
  model.body.scale.set(1 - breath * 0.11, 1 + breath * 0.18, 1);
  model.eyes.position.set(px * 0.026, -py * 0.025, 0);
  // One quiet blink every few seconds. With reduced motion eyes remain open.
  const blinkPhase = time % 5.4;
  const blink = !reduced && blinkPhase > 4.91 && blinkPhase < 5.09
    ? 1 - Math.sin((blinkPhase - 4.91) / 0.18 * Math.PI) * 0.9 : 1;
  model.eyes.scale.y = blink;
  model.eyes.position.y += 0.154 * (1 - blink);
  model.leftArm.rotation.z = Math.sin(time * 1.2) * 0.045 - envelope * (1.9 + Math.sin(elapsed * 17) * 0.18);
  model.leftArm.rotation.x = envelope * -0.12;
  model.rightArm.rotation.z = Math.sin(time * 1.2 + 0.8) * 0.023;
  model.tote.rotation.z = -0.07 + Math.sin(time * 1.05) * 0.025 + envelope * 0.09;
  model.leftShoe.rotation.x = hop * -0.45;
  model.rightShoe.rotation.x = hop * -0.35;
}
