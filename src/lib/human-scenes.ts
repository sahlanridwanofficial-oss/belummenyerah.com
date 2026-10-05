import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type HumanSceneController = {
  setProgress: (value: number) => void;
  pause: (value: boolean) => void;
  dispose: () => void;
};
type LoadedScene = {
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
  camera: THREE.PerspectiveCamera;
  center: THREE.Vector3;
  size: THREE.Vector3;
};
const URLS = [
  "/models/learning.glb",
  "/models/business.glb",
  "/models/collaboration.glb",
];
const COLORS = ["#f6d8b8", "#f4cbac", "#f0c29d"];

/** Actual skinned scan-derived glTF humans with original PBR texture maps. */
export function createHumanScenes(
  host: HTMLElement,
  status: (index: number, ready: boolean) => void,
): HumanSceneController {
  function compactLayout() {
    return window.innerWidth <= 800 ||
      (window.innerWidth <= 1000 && window.innerHeight <= 520);
  }
  // Choose the texture tier once. Rotation/resizing only reframes the existing
  // assets, avoiding another download and a second set of resident textures.
  const compactAssets = compactLayout();
  const assetURLs = URLS.map((url) =>
    compactAssets ? url.replace(".glb", "-mobile.glb") : url,
  );
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  const abort = new AbortController();
  const cleanups: (() => void)[] = [];
  let disposed = false,
    paused = false,
    visible = true,
    desired = 0,
    shown = 0,
    frame = 0,
    lastTime = 0;
  const loaded: (LoadedScene | null)[] = [null, null, null];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let pointerX = 0,
    pointerY = 0;

  function disposeModel(group: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    const bitmaps = new Set<ImageBitmap>();
    const skeletons = new Set<THREE.Skeleton>();
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material)
        for (const material of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          materials.add(material);
          for (const value of Object.values(material))
            if (value instanceof THREE.Texture) textures.add(value);
        }
    });
    geometries.forEach((value) => value.dispose());
    materials.forEach((value) => value.dispose());
    textures.forEach((value) => {
      const pixels = value.source.data;
      if (typeof ImageBitmap !== "undefined" && pixels instanceof ImageBitmap)
        bitmaps.add(pixels);
      value.dispose();
    });
    bitmaps.forEach((value) => value.close());
    skeletons.forEach((value) => value.dispose());
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    cancelAnimationFrame(frame);
    for (const stop of cleanups.reverse()) stop();
    for (const asset of loaded)
      if (asset) {
        asset.mixer.stopAllAction();
        asset.mixer.uncacheRoot(asset.group);
        disposeModel(asset.group);
      }
    renderer.dispose();
    renderer.domElement.remove();
  }

  try {
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, host.clientWidth < 800 ? 1.25 : 1.6),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 120);
    const background = new THREE.Color(COLORS[0]);
    scene.background = background;
    scene.fog = new THREE.Fog(COLORS[0], 13, 35);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    let env: THREE.WebGLRenderTarget;
    try {
      env = pmrem.fromScene(room, 0.08);
    } finally {
      room.dispose();
      pmrem.dispose();
    }
    scene.environment = env.texture;
    scene.environmentIntensity = 0.35;
    cleanups.push(() => env.dispose());

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: COLORS[0],
      roughness: 0.85,
      metalness: 0,
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      floorMaterial,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.012;
    floor.receiveShadow = true;
    scene.add(floor);
    cleanups.push(() => {
      floor.geometry.dispose();
      floorMaterial.dispose();
    });
    // A dominant low-angle key models the figures; restrained fill preserves
    // amber shadow depth instead of washing every surface with ambient light.
    scene.add(new THREE.HemisphereLight("#fff2dd", "#aa6d3c", 0.55));
    const key = new THREE.DirectionalLight("#fff0d5", 4);
    key.castShadow = true;
    key.shadow.mapSize.set(
      host.clientWidth < 800 ? 512 : 1024,
      host.clientWidth < 800 ? 512 : 1024,
    );
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.025;
    scene.add(key, key.target);
    cleanups.push(() => key.shadow.dispose());
    const amber = new THREE.DirectionalLight("#ffe9cc", 0.55);
    scene.add(amber, amber.target);
    const rim = new THREE.DirectionalLight("#ffbb70", 1.55);
    scene.add(rim, rim.target);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const fromPosition = new THREE.Vector3(),
      toPosition = new THREE.Vector3();
    const fromQuaternion = new THREE.Quaternion(),
      toQuaternion = new THREE.Quaternion();
    const frameCamera = new THREE.PerspectiveCamera();

    function targetFrame(
      asset: LoadedScene,
      position: THREE.Vector3,
      quaternion: THREE.Quaternion,
    ) {
      asset.camera.getWorldPosition(position);
      asset.camera.getWorldQuaternion(quaternion);
      if (compactLayout()) {
        const direction = asset.camera
          .getWorldDirection(new THREE.Vector3())
          .multiplyScalar(-1);
        const size = Math.max(
          asset.size.y,
          asset.size.x / camera.aspect,
          asset.size.z * 0.6,
        );
        const distance =
          (size * 1.28) /
          (2 * Math.tan(THREE.MathUtils.degToRad(asset.camera.fov) / 2));
        position.copy(asset.center).addScaledVector(direction, distance);
        frameCamera.position.copy(position);
        frameCamera.lookAt(asset.center);
        quaternion.copy(frameCamera.quaternion);
      }
    }
    function draw(delta = 0) {
      if (disposed) return;
      const p = reduceMotion.matches ? Math.round(desired) : shown;
      const a = Math.min(2, Math.floor(p)),
        b = Math.min(2, a + 1),
        mix = p - a;
      const first = loaded[a] ?? loaded[Math.round(p)] ?? loaded.find(Boolean);
      if (!first) return;
      const second = loaded[b] ?? first;
      targetFrame(first, fromPosition, fromQuaternion);
      targetFrame(second, toPosition, toQuaternion);
      const smooth = mix * mix * (3 - 2 * mix);
      camera.position.lerpVectors(fromPosition, toPosition, smooth);
      camera.quaternion.slerpQuaternions(fromQuaternion, toQuaternion, smooth);
      camera.fov =
        first.camera.fov + (second.camera.fov - first.camera.fov) * smooth;
      if (!compactLayout()) {
        const firstAspect = first.camera.aspect > 0 ? first.camera.aspect : 1.6;
        const secondAspect = second.camera.aspect > 0 ? second.camera.aspect : 1.6;
        const authoredAspect = firstAspect + (secondAspect - firstAspect) * smooth;
        // Match the exported lens at its authored ratio; wider vertical coverage
        // is needed only when the viewport is narrower than that composition.
        camera.fov = (2 * Math.atan(
          Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) *
          Math.max(1, authoredAspect / camera.aspect),
        ) * 180) / Math.PI;
      }
      camera.updateProjectionMatrix();
      if (!paused && !reduceMotion.matches && finePointer.matches) {
        camera.position.x += pointerX * 0.07;
        camera.position.y += pointerY * 0.025;
      }
      background.set(COLORS[a]).lerp(new THREE.Color(COLORS[b]), smooth);
      floorMaterial.color.copy(background);
      if (scene.fog) scene.fog.color.copy(background);
      const x = p * 7;
      key.position.set(x - 3.8, 3, 4);
      key.target.position.set(x, 0.8, 0);
      amber.position.set(x + 3, 2.2, 3);
      amber.target.position.set(x, 1, 0);
      rim.position.set(x + 2.8, 3.5, -3.2);
      rim.target.position.set(x, 1, 0);
      loaded.forEach((asset, index) => {
        if (asset) {
          asset.group.visible = Math.abs(index - p) < 1.05;
          if (delta && !paused && !reduceMotion.matches && asset.group.visible)
            asset.mixer.update(delta);
        }
      });
      renderer.render(scene, camera);
    }
    function animate(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;
      shown += (desired - shown) * 0.16;
      if (Math.abs(desired - shown) < 0.001) shown = desired;
      draw(delta);
      if (
        (!paused && !reduceMotion.matches) ||
        Math.abs(desired - shown) > 0.001
      )
        frame = requestAnimationFrame(animate);
    }
    function resume() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (disposed || !visible || document.hidden) return;
      if (reduceMotion.matches) {
        shown = Math.round(desired);
        draw();
      } else frame = requestAnimationFrame(animate);
    }
    function resize() {
      if (disposed) return;
      const width = Math.max(1, host.clientWidth),
        height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    }
    function pointer(event: PointerEvent) {
      if (!finePointer.matches || reduceMotion.matches || paused) return;
      const box = host.getBoundingClientRect();
      pointerX = (event.clientX - box.left) / box.width - 0.5;
      pointerY = 0.5 - (event.clientY - box.top) / box.height;
    }
    function leave() {
      pointerX = 0;
      pointerY = 0;
    }
    function contextLost(event: Event) {
      event.preventDefault();
      dispose();
      status(-1, false);
    }
    host.addEventListener("pointermove", pointer);
    host.addEventListener("pointerleave", leave);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", resume);
    reduceMotion.addEventListener("change", resume);
    cleanups.push(() => {
      host.removeEventListener("pointermove", pointer);
      host.removeEventListener("pointerleave", leave);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", resume);
      reduceMotion.removeEventListener("change", resume);
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        resume();
      },
      { threshold: 0.01 },
    );
    observer.observe(host);
    cleanups.push(() => observer.disconnect());
    const dimensions = new ResizeObserver(resize);
    dimensions.observe(host);
    cleanups.push(() => dimensions.disconnect());

    async function load(index: number) {
      try {
        const response = await fetch(assetURLs[index], { signal: abort.signal });
        if (!response.ok) throw new Error("Scene asset unavailable");
        const gltf: GLTF = await loader.parseAsync(
          await response.arrayBuffer(),
          "/models/",
        );
        if (disposed) {
          disposeModel(gltf.scene);
          return;
        }
        gltf.scene.position.x = index * 7;
        gltf.scene.updateMatrixWorld(true);
        const sourceCamera = gltf.cameras[0] as
          THREE.PerspectiveCamera | undefined;
        if (!(sourceCamera instanceof THREE.PerspectiveCamera)) {
          disposeModel(gltf.scene);
          throw new Error("Scene camera missing");
        }
        gltf.scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) {
            // Preserve scan albedo, normal, roughness and metalness maps exactly
            // as authored. Warmth comes from the set and lights, not a recolor.
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        const mixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        mixer.setTime(0);
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse(object => {
          if (object instanceof THREE.SkinnedMesh) {
            object.skeleton.update();
            object.computeBoundingBox();
          }
        });
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        loaded[index] = {
          group: gltf.scene,
          mixer,
          camera: sourceCamera,
          center: bounds.getCenter(new THREE.Vector3()),
          size: bounds.getSize(new THREE.Vector3()),
        };
        scene.add(gltf.scene);
        resize();
        resume();
        status(index, true);
      } catch (error) {
        if (
          !disposed &&
          !(error instanceof DOMException && error.name === "AbortError")
        )
          status(index, false);
      }
    }
    resize();
    void load(0).then(() => {
      if (!disposed) {
        void load(1);
        void load(2);
      }
    });
    return {
      setProgress(value) {
        desired = Math.max(0, Math.min(2, value));
        resume();
      },
      pause(value) {
        paused = value;
        resume();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
