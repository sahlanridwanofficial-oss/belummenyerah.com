import * as THREE from "three";

/** An original, completely procedural sculpture. There are no downloaded meshes. */
export const CROWD_PALETTE = {
  paper: "#F4F3EF",
  ink: "#14140F",
  yellow: "#F4CE58",
  butter: "#F3DB86",
  cream: "#E9E5D8",
  stone: "#AAA99D",
  stoneLight: "#BDBCB0",
  stoneDark: "#8E9085",
} as const;

type Point = [number, number, number];
type Chain = {
  upper: THREE.Mesh;
  socket?: THREE.Mesh;
  lower: THREE.Mesh;
  joint: THREE.Mesh;
  end: THREE.Mesh;
  upperLength: number;
  lowerLength: number;
  /** Absolute coordinates in the actor's fixed frame. Useful for contact tests. */
  start: Point;
  bend: Point;
  target: Point;
};
export type CrowdActor = {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  arms: [Chain, Chain];
  legs: [Chain, Chain];
  feet: [THREE.Mesh, THREE.Mesh];
  anchors: [Point, Point];
  origin: Point;
  hipHeight: number;
  torsoHeight: number;
  width: number;
  phase: number;
  lean: number;
  eyes: [THREE.Mesh, THREE.Mesh];
};
export type CrowdModel = {
  root: THREE.Group;
  rock: THREE.Group;
  actors: CrowdActor[];
  dispose: () => void;
};
export type CrowdPose = {
  time: number;
  effort?: number;
  lift?: number;
  pointerX?: number;
  pointerY?: number;
  reducedMotion?: boolean;
};
const finite = (n: number | undefined, fallback = 0) => Number.isFinite(n) ? n as number : fallback;
const clamp = (n: number | undefined, min = 0, max = 1) => Math.min(max, Math.max(min, finite(n)));
const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Point, n: number): Point => [a[0] * n, a[1] * n, a[2] * n];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a: Point) => Math.sqrt(dot(a, a));
const unit = (a: Point): Point => mul(a, 1 / Math.max(0.00001, length(a)));
/** Short authored beats, with zero-velocity arrivals instead of a uniform bob. */
function track(phase: number, keys: [number, number][]) {
  for (let i = 1; i < keys.length; i++) {
    if (phase <= keys[i][0]) {
      const [a, av] = keys[i - 1], [b, bv] = keys[i];
      const u = Math.min(1, Math.max(0, (phase - a) / (b - a)));
      const ease = u * u * (3 - 2 * u);
      return av + (bv - av) * ease;
    }
  }
  return keys[keys.length - 1][1];
}
const UP = new THREE.Vector3(0, 1, 0);
const direction = new THREE.Vector3();

/** A broad, softly shouldered body with a full elliptical cross section. */
function bodyGeometry() {
  const rings = [
    [0.00, .50, .68], [.06, .81, .88], [.20, .99, 1.00],
    [.39, 1.00, 1.00], [.59, .91, .93], [.76, .78, .84],
    [.91, .56, .64], [1.00, .28, .37],
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  const sides = 16;
  for (const [y, rx, rz] of rings) {
    for (let i = 0; i < sides; i++) {
      const theta = i * Math.PI * 2 / sides;
      positions.push(Math.cos(theta) * rx, y, Math.sin(theta) * rz);
    }
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < sides; i++) {
      const a = r * sides + i, b = r * sides + (i + 1) % sides;
      indices.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }
  const bottom = positions.length / 3; positions.push(0, 0, 0);
  const top = positions.length / 3; positions.push(0, 1, 0);
  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides;
    indices.push(bottom, i, next, top, 7 * sides + next, 7 * sides + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Uneven authored rings make large quiet planes, rather than a spiky sphere. */
function rockGeometry() {
  const rings: Point[][] = [
    [[-1.48, 0, -.60], [-.54, 0, -.84], [.62, 0, -.81], [1.48, 0, -.55], [1.84, 0, .10], [1.28, 0, .73], [.18, 0, .92], [-1.07, 0, .77], [-1.85, 0, .17]],
    [[-1.79, .47, -.74], [-.60, .70, -1.02], [.69, .59, -.97], [1.78, .44, -.68], [1.98, .46, .13], [1.56, .62, .85], [.06, .46, 1.02], [-1.27, .41, .93], [-2.00, .39, .18]],
    [[-1.34, 1.02, -.46], [-.48, 1.32, -.58], [.56, 1.26, -.64], [1.35, 1.02, -.40], [1.49, .90, .18], [.96, 1.15, .62], [.05, 1.35, .70], [-.98, 1.06, .59], [-1.50, .92, .12]],
  ];
  const positions: number[] = [];
  function triangle(a: Point, b: Point, c: Point) { positions.push(...a, ...b, ...c); }
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 9; i++) {
      const j = (i + 1) % 9;
      // Deliberate alternating diagonals avoid a regular lathed pattern.
      if (i % 2) {
        triangle(rings[r][i], rings[r + 1][i], rings[r + 1][j]);
        triangle(rings[r][i], rings[r + 1][j], rings[r][j]);
      } else {
        triangle(rings[r][i], rings[r + 1][i], rings[r][j]);
        triangle(rings[r][j], rings[r + 1][i], rings[r + 1][j]);
      }
    }
  }
  for (let i = 0; i < 9; i++) {
    const j = (i + 1) % 9;
    triangle([0, 0, 0], rings[0][i], rings[0][j]);
    triangle([-.12, 1.45, -.02], rings[2][j], rings[2][i]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Rigid length-preserving two-bone IK. The bend direction is projected off the reach axis. */
function solveChain(chain: Chain, from: Point, to: Point, preferredBend: Point) {
  const delta = sub(to, from);
  const d = Math.max(.00001, length(delta));
  const axis = unit(delta);
  const distance = Math.min(d, chain.upperLength + chain.lowerLength - .000001);
  const along = (chain.upperLength ** 2 - chain.lowerLength ** 2 + distance ** 2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, chain.upperLength ** 2 - along ** 2));
  let bend = sub(preferredBend, mul(axis, dot(preferredBend, axis)));
  if (length(bend) < .001) bend = [0, 0, 1];
  const joint = add(add(from, mul(axis, along)), mul(unit(bend), height));
  if (chain.socket) chain.socket.position.set(...from);
  chain.start = from;
  chain.bend = joint;
  chain.target = to;
  function aim(mesh: THREE.Mesh, a: Point, b: Point) {
    mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    direction.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    mesh.quaternion.setFromUnitVectors(UP, direction);
  }
  aim(chain.upper, from, joint);
  aim(chain.lower, joint, to);
  chain.joint.position.set(...joint);
  chain.end.position.set(...to);
}

export function createCrowdModel(): CrowdModel {
  const root = new THREE.Group(); root.name = "belum-menyerah-original-crowd";
  const rock = new THREE.Group(); rock.name = "together-held-boulder"; root.add(rock);
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const material = (color: string) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
    materials.add(m); return m;
  };
  const yellow = material(CROWD_PALETTE.yellow), butter = material(CROWD_PALETTE.butter);
  const cream = material(CROWD_PALETTE.cream), paper = material(CROWD_PALETTE.paper);
  const stone = material(CROWD_PALETTE.stone), ink = material(CROWD_PALETTE.ink);
  const outline = new THREE.MeshBasicMaterial({ color: CROWD_PALETTE.ink, side: THREE.BackSide });
  materials.add(outline);
  const own = <T extends THREE.BufferGeometry>(geometry: T) => { geometries.add(geometry); return geometry; };
  const round = own(new THREE.SphereGeometry(1, 12, 8));
  const eyeRound = own(new THREE.SphereGeometry(1, 8, 6));
  const torso = own(bodyGeometry());
  const cylinder = own(new THREE.CylinderGeometry(1, 1, 1, 10));
  const boulder = own(rockGeometry());
  function mesh(name: string, geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, outlined = true) {
    const m = new THREE.Mesh(geometry, mat); m.name = name; m.castShadow = true; m.receiveShadow = true; parent.add(m);
    if (outlined) {
      const edge = new THREE.Mesh(geometry, outline); edge.name = `${name}-ink-contour`;
      edge.scale.setScalar(1.021); m.add(edge);
    }
    return m;
  }
  function blob(name: string, parent: THREE.Object3D, mat: THREE.Material, size: Point, position: Point = [0, 0, 0], outlined = true) {
    const m = mesh(name, round, mat, parent, outlined); m.scale.set(...size); m.position.set(...position); return m;
  }
  mesh("large-irregular-stone", boulder, stone, rock, true);

  // Back-row people occupy the actual rear of the rock, visible through the gaps.
  const specs = [
    { x: -1.03, z: -.43, hip: .89, torso: .82, width: .263, head: [.252, .28, .236] as Point, mat: cream, lean: -.085, phase: .7 },
    { x: .02, z: -.51, hip: .96, torso: .83, width: .258, head: [.25, .304, .24] as Point, mat: butter, lean: .045, phase: 2.1 },
    { x: 1.07, z: -.42, hip: .87, torso: .81, width: .27, head: [.26, .273, .238] as Point, mat: cream, lean: .085, phase: 3.5 },
    { x: -1.48, z: .38, hip: .77, torso: .74, width: .286, head: [.273, .257, .25] as Point, mat: yellow, lean: -.12, phase: .1 },
    { x: -.48, z: .69, hip: .72, torso: .76, width: .327, head: [.293, .265, .256] as Point, mat: paper, lean: -.055, phase: 1.3 },
    { x: .51, z: .65, hip: .83, torso: .82, width: .285, head: [.267, .283, .243] as Point, mat: yellow, lean: .09, phase: 2.8 },
    { x: 1.47, z: .32, hip: .77, torso: .72, width: .302, head: [.28, .252, .25] as Point, mat: butter, lean: .13, phase: 4.2 },
  ];
  const actors: CrowdActor[] = [];
  for (const [index, s] of specs.entries()) {
    const group = new THREE.Group(); group.name = `supporter-${index + 1}`; group.position.set(s.x, 0, s.z); root.add(group);
    const body = new THREE.Group(); body.name = "soft-rounded-body"; group.add(body);
    const core = mesh("continuous-bean-torso", torso, s.mat, body);
    core.scale.set(s.width, s.torso, s.width * .75);
    core.position.y = -.07;
    const head = new THREE.Group(); head.name = "quiet-determined-face";
    head.position.set(0, s.torso + s.head[1] * .54, .008); body.add(head);
    blob("rounded-head", head, s.mat, s.head);
    const eyes: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const eye = mesh("tiny-ink-eye", eyeRound, ink, head, false);
      eye.scale.set(.025, .032, .018);
      eye.position.set(side * s.head[0] * .30, .030 + (side * .006), s.head[2] * .962);
      eye.rotation.z = side * -.11; eyes.push(eye);
    }
    // Soft monochrome feet remain broad and grounded; no miniature shoe detail.
    const feet = [-1, 1].map(side => {
      const foot = blob("planted-rounded-foot", group, s.mat, [.15, .115, .235], [side * (s.width * .64 + .055), .114, .085 + (side === 1 ? -.09 : .025)]);
      foot.rotation.y = side * -.22; return foot;
    }) as [THREE.Mesh, THREE.Mesh];
    function chain(name: string, l1: number, l2: number, radius: number, endSize: Point): Chain {
      const upper = mesh(`${name}-upper`, cylinder, s.mat, group);
      const lower = mesh(`${name}-lower`, cylinder, s.mat, group);
      upper.scale.set(radius, l1, radius); lower.scale.set(radius * .96, l2, radius * .96);
      const joint = blob(`${name}-soft-joint`, group, s.mat, [radius * 1.025, radius * 1.025, radius * 1.025]);
      const end = blob(`${name}-end`, group, s.mat, endSize);
      return { upper, lower, joint, end, upperLength: l1, lowerLength: l2, start: [0, 0, 0], bend: [0, 0, 0], target: [0, 0, 0] };
    }
    const arms = [-1, 1].map(side => {
      const arm = chain(side < 0 ? "left-supporting-arm" : "right-supporting-arm", .65, .63, .09 + s.width * .065, [.126, .070, .135]);
      arm.socket = blob("soft-shoulder-join", group, s.mat, [.116, .116, .116]);
      // An understated thumb makes contact read as a palm, without tiny fingers.
      blob("supporting-palm-thumb", arm.end, s.mat, [.37, .74, .39], [side * .77, -.12, .12], false);
      return arm;
    }) as [Chain, Chain];
    const legs = [-1, 1].map(side => {
      const leg = chain(side < 0 ? "left-braced-leg" : "right-braced-leg", s.hip * .56, s.hip * .56, .12 + s.width * .04, [.136, .13, .135]);
      leg.socket = blob("soft-hip-join", group, s.mat, [.14, .14, .14], [0, 0, 0], false);
      return leg;
    }) as [Chain, Chain];
    const isBack = index < 3;
    const anchors = [-1, 1].map(side => [
      Math.max(-1.68, Math.min(1.68, s.x + side * .23)),
      -.063,
      s.z + (isBack ? .11 : -.16),
    ] as Point) as [Point, Point];
    actors.push({ root: group, body, head, arms, legs, feet, anchors, origin: [s.x, 0, s.z], hipHeight: s.hip, torsoHeight: s.torso, width: s.width, phase: s.phase, lean: s.lean, eyes: eyes as [THREE.Mesh, THREE.Mesh] });
  }
  let disposed = false;
  const model = { root, rock, actors, dispose() {
    if (disposed) return;
    disposed = true;
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  } };
  poseCrowd(model, { time: 0, effort: .28, lift: 0 });
  return model;
}

/**
 * Absolute deterministic posing: time never accumulates, and no limb is rescaled.
 * Rock and palms share the same transform. Feet never leave their planted positions.
 * Reduced motion freezes all decorative motion, while preserving a chosen lift state.
 */
export function poseCrowd(model: CrowdModel, pose: CrowdPose) {
  const still = Boolean(pose.reducedMotion);
  const t = still ? 0 : finite(pose.time);
  const effort = clamp(pose.effort);
  const lift = clamp(pose.lift);
  const px = still ? 0 : clamp(pose.pointerX, -1, 1);
  const py = still ? 0 : clamp(pose.pointerY, -1, 1);
  const breath = still ? 0 : Math.sin(t * 1.45) * .005 + Math.sin(t * .73 + .7) * .004;
  const rockRoll = still ? 0 : Math.sin(t * .67) * .009 + px * .012;
  const rockPitch = still ? 0 : Math.sin(t * .87 + .4) * .006;
  model.root.position.set(0, 0, 0);
  model.root.rotation.set(0, 0, 0);
  model.rock.position.set(0, 2.34 + lift * .33 + breath, 0);
  model.rock.rotation.set(rockPitch, 0, rockRoll);
  // Euler XYZ rotation, matching the rock; no world-matrix dependency or allocations.
  function rockPoint(p: Point): Point {
    const cz = Math.cos(rockRoll), sz = Math.sin(rockRoll), cx = Math.cos(rockPitch), sx = Math.sin(rockPitch);
    const x = p[0] * cz - p[1] * sz, y = p[0] * sz + p[1] * cz;
    return [x, y * cx - p[2] * sx + model.rock.position.y, y * sx + p[2] * cx];
  }
  for (const [index, actor] of model.actors.entries()) {
    const period = 5.7 + index * .37;
    const phase = (((t + actor.phase * 1.29) % period) + period) % period / period;
    const brace = still ? 0 : track(phase, [[0, 0], [.10, 0], [.19, .52], [.31, 1], [.44, 0], [.53, -.3], [.65, 0], [1, 0]]);
    const leanBeat = still ? 0 : track(phase, [[0, 0], [.12, 0], [.27, 1], [.43, -.5], [.62, 0], [1, 0]]);
    const glance = still ? 0 : track(phase, [[0, 0], [.64, 0], [.73, 1], [.82, 1], [.95, 0], [1, 0]]);
    const gather = effort * .055 * (1 - lift * .8);
    let hip = actor.hipHeight + lift * .145 - gather - brace * .070 * (1 - lift * .68);
    const lean = actor.lean + leanBeat * .075 * (index % 2 ? 1 : -1) + px * .012;
    const sway = leanBeat * .015 * (index % 2 ? 1 : -1);
    actor.body.rotation.set(.025 + effort * .07 + brace * .025, 0, lean);
    actor.head.rotation.set(-.10 - py * .045 + brace * .045, px * .055 + glance * .24 * (index % 2 ? -1 : 1), -lean * .27);
    function bodyPoint(p: Point): Point {
      const c = Math.cos(lean), s = Math.sin(lean);
      const cx = Math.cos(actor.body.rotation.x), sx = Math.sin(actor.body.rotation.x);
      const x = p[0] * c - p[1] * s, y = p[0] * s + p[1] * c;
      return [x + sway, y * cx - p[2] * sx + hip, y * sx + p[2] * cx - .014 * effort];
    }
    // Preserve a little elbow bend at extreme lift/effort combinations. This
    // physically limits a crouch instead of stretching a limb or losing contact.
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      const side = sideIndex === 0 ? -1 : 1;
      const shoulder = bodyPoint([side * actor.width * .67, actor.torsoHeight * .75, 0]);
      const hand = sub(rockPoint(actor.anchors[sideIndex]), actor.origin);
      const reach = actor.arms[sideIndex].upperLength + actor.arms[sideIndex].lowerLength - .015;
      const horizontal = (hand[0] - shoulder[0]) ** 2 + (hand[2] - shoulder[2]) ** 2;
      const vertical = Math.sqrt(Math.max(.01, reach ** 2 - horizontal));
      hip = Math.max(hip, hand[1] - (shoulder[1] - hip) - vertical);
    }
    actor.body.position.set(sway, hip, -.014 * effort);
    for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
      const side = sideIndex === 0 ? -1 : 1;
      const foot = actor.feet[sideIndex];
      const shoulder = bodyPoint([side * actor.width * .67, actor.torsoHeight * .75, 0]);
      const worldHand = rockPoint(actor.anchors[sideIndex]);
      const hand = sub(worldHand, actor.origin);
      const outside = (index === 3 && side === -1) || (index === 6 && side === 1);
      // Interior elbows bend toward the viewer, leaving the rear faces visible
      // between supporters. The two outside arms keep a wide braced silhouette.
      const elbowDirection: Point = index < 3 ? [side * .50, .1, -.80]
        : outside ? [side * .85, .15, .50] : [side * .16, .12, 1];
      solveChain(actor.arms[sideIndex], shoulder, hand, elbowDirection);
      actor.arms[sideIndex].end.rotation.set(rockPitch, side * .14, rockRoll);
      const pelvis = bodyPoint([side * actor.width * .53, .035, 0]);
      const ankle: Point = [foot.position.x, .18, foot.position.z - .045];
      solveChain(actor.legs[sideIndex], pelvis, ankle, [side * .23, 0, .96]);
      actor.legs[sideIndex].end.rotation.set(0, 0, 0);
    }
    // Infrequent staggered soft blinks, absolute in time and disabled when still.
    const blinkPeriod = 5.4 + index * .21;
    const blinkCycle = ((t + actor.phase * 2) % blinkPeriod + blinkPeriod) % blinkPeriod;
    const blink = !still && blinkCycle < .12 ? .24 + .76 * Math.abs(blinkCycle - .06) / .06 : 1;
    for (const eye of actor.eyes) eye.scale.y = .032 * blink;
  }
}
