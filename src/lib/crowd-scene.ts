import * as THREE from "three";
import { createCrowdModel, poseCrowd } from "./crowd-model";
import { createBekalMotionController } from "./bekal-motion";

export { createCrowdModel, poseCrowd } from "./crowd-model";


export type CrowdSceneController = {
  setPaused: (paused: boolean) => void;
  setPointer: (x: number, y: number) => void;
  help: () => boolean;
  dispose: () => void;
};
export type CrowdSceneHandle = CrowdSceneController;
export type CrowdSceneCallbacks = {
  onReady: () => void;
  onError: (error: unknown) => void;
  onActionChange?: (active: boolean) => void;
};

const clamp = (value: number, low: number, high: number) =>
  Number.isFinite(value) ? Math.max(low, Math.min(high, value)) : 0;

/**
 * A self-contained, transparent, genuinely rendered Three.js scene. There are
 * no asset fetches, videos, copied models, canvas illustrations, or frame strips.
 * The owner controls intersection/pause; the runtime also guards document
 * visibility, reduced motion and lost GPU contexts.
 */
export function startCrowdScene(
  host: HTMLElement,
  callbacks: CrowdSceneCallbacks,
): CrowdSceneController {
  let renderer: THREE.WebGLRenderer | null = null;
  let model: ReturnType<typeof createCrowdModel> | null = null;
  let disposed = false;
  let paused = false;
  let ready = false;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  const compact = window.innerWidth <= 800;
  let actionActive = false;
  const motion = createBekalMotionController({
    cooldownSeconds: 0.4,
    idle: { duration: 11, keyframes: [
      { at: 0.18, pose: { squash: 0.25, bodyLift: 0.06 } },
      { at: 0.34, pose: { squash: 0.48, bodyLift: 0.02, bodyTurn: 0.16 } },
      { at: 0.53, pose: { squash: 0.10, bodyLift: 0.12 } },
      { at: 0.68, pose: { squash: 0.34, bodyLift: 0.04, bodyTurn: -0.1 } },
      { at: 0.85, pose: { squash: 0.18, bodyLift: 0.08 } },
      { at: 1, pose: {} },
    ] },
    clips: { lift: {
      attention: { duration: 0.28, keyframes: [{ at: 1, pose: { squash: 0.85, bodyLift: 0.03 } }] },
      gesture: { duration: 3.5, keyframes: [
        { at: 0.14, pose: { bodyLift: 0.45, squash: 0.65 } },
        { at: 0.42, pose: { bodyLift: 1, squash: 0.15, expression: 1 } },
        { at: 0.75, pose: { bodyLift: 1, squash: 0.26, expression: 1 } },
        { at: 1, pose: { bodyLift: 0.75, squash: 0.48 } },
      ] },
      settle: { duration: 1.35, keyframes: [
        { at: 0.6, pose: { bodyLift: 0.12, squash: 0.35 } },
        { at: 1, pose: {} },
      ] },
    } },
  });
  let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
  const cleanups: (() => void)[] = [];
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    for (const cleanup of cleanups.reverse()) cleanup();
    model?.dispose();
    motion.dispose();
    renderer?.dispose();
    renderer?.domElement.remove();
  }
  function fail(error: unknown) {
    if (disposed) return;
    dispose();
    callbacks.onActionChange?.(false);
    callbacks.onError(error);
  }
  const controller: CrowdSceneController = {
    setPaused(value) {
      if (disposed || paused === value) return;
      paused = value;
      motion.setEnvironment({ paused });
      if (paused) stop();
      else resume();
    },
    setPointer(x, y) {
      if (disposed) return;
      targetX = clamp(x, -1, 1);
      targetY = clamp(y, -1, 1);
    },
    help() {
      if (disposed || paused || media.matches || document.hidden || actionActive || motion.sample().cooldownRemaining > 0) return false;
      const result = motion.dispatch({ kind: "lift", strength: 1 });
      if (result !== "started") return false;
      actionActive = true;
      callbacks.onActionChange?.(true);
      resume();
      return true;
    },
    dispose,
  };
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let contact: THREE.Mesh;
  let contactMaterial: THREE.ShaderMaterial;
  let distance = 10;
  function placeCamera(lift = 0) {
    if (!camera) return;
    const intro = media.matches ? 1 : Math.min(1, elapsed / 2.2);
    const reveal = intro * intro * (3 - 2 * intro);
    const arc = media.matches ? 0 : -0.14 * (1 - reveal) + Math.sin(elapsed * 0.18) * 0.08;
    const dolly = distance * (0.96 + reveal * 0.04 - lift * 0.025);
    camera.position.set(Math.sin(arc) * dolly, 1.93 + dolly * 0.11, Math.cos(arc) * dolly);
    camera.lookAt(0, 1.93 + lift * 0.07, 0);
  }

  function render() {
    if (disposed || !renderer || !model) return;
    try {
      const sample = motion.sample();
      poseCrowd(model, { time: elapsed, pointerX, pointerY, effort: sample.pose.squash, lift: sample.pose.bodyLift, reducedMotion: media.matches });
      placeCamera(sample.pose.bodyLift);
      if (actionActive && sample.phase === "idle") {
        actionActive = false;
        callbacks.onActionChange?.(false);
      }
      contactMaterial.uniforms.strength.value = 0.16;
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        callbacks.onReady();
      }
    } catch (error) {
      fail(error);
    }
  }
  function animate(now: number) {
    frame = 0;
    if (disposed || paused || media.matches || document.hidden) return;
    if (compact && previousTime && now - previousTime < 32) {
      frame = requestAnimationFrame(animate);
      return;
    }
    const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    elapsed += delta;
    const ease = 1 - Math.exp(-delta * 6);
    pointerX += (targetX - pointerX) * ease;
    pointerY += (targetY - pointerY) * ease;
    motion.tick(now);
    render();
    if (!disposed && !paused && !media.matches && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function resume() {
    if (disposed || paused || document.hidden) return;
    if (media.matches) {
      motion.setEnvironment({ reducedMotion: true });
      render();
      return;
    }
    if (!frame) frame = requestAnimationFrame(animate);
  }

  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    motion.setEnvironment({ reducedMotion: media.matches, hidden: document.hidden });
    model = createCrowdModel();
    scene.add(model.root);

    // Broad studio-like lighting preserves the satin form and warm yellow.
    scene.add(new THREE.HemisphereLight("#fffdf6", "#aaa695", 1.4));
    const key = new THREE.DirectionalLight("#fff7e7", 3.5);
    key.position.set(-3.5, 6, 5);
    key.target.position.set(0, 1.2, 0);
    key.castShadow = true;
    const shadowSize = window.innerWidth <= 800 ? 512 : 1024;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    key.shadow.camera.left = -3.5;
    key.shadow.camera.right = 3.5;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -3;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 15;
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.025;
    scene.add(key, key.target);
    cleanups.push(() => key.shadow.dispose());
    const fill = new THREE.DirectionalLight("#f4f3ef", 0.9);
    fill.position.set(4, 2, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight("#fff6d6", 1.4);
    rim.position.set(1.5, 5, -3);
    scene.add(rim);

    // A transparent floor catches the real mesh shadow without painting over
    // the host's paper color. A texture-free analytic contact shadow grounds it.
    const floorMaterial = new THREE.ShadowMaterial({ color: "#242117", opacity: 0.13, depthWrite: false });
    const floorGeometry = new THREE.PlaneGeometry(18, 18);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.032;
    floor.receiveShadow = true;
    scene.add(floor);
    contactMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { strength: { value: 0.19 } },
      vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec2 vUv; uniform float strength; void main(){vec2 p=(vUv-0.5)*2.0;float r=dot(p,p);float a=exp(-r*4.2)*(1.0-smoothstep(0.48,1.0,r))*strength;gl_FragColor=vec4(0.12,0.11,0.08,a);}",
    });
    const contactGeometry = new THREE.PlaneGeometry(4.7, 2.9);
    contact = new THREE.Mesh(contactGeometry, contactMaterial);
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(0.04, -0.028, 0.09);
    scene.add(contact);
    cleanups.push(() => {
      floorGeometry.dispose(); floorMaterial.dispose();
      contactGeometry.dispose(); contactMaterial.dispose();
    });

    function resize() {
      if (disposed || !renderer) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Room for the shared boulder lift, planted feet and the moving camera.
      const verticalFrame = Math.max(5.05, 4.9 / camera.aspect);
      distance = verticalFrame / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      placeCamera(motion.sample().pose.bodyLift);
      camera.updateProjectionMatrix();
      render();
    }
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      cleanups.push(() => resizeObserver.disconnect());
    } else {
      window.addEventListener("resize", resize);
      cleanups.push(() => window.removeEventListener("resize", resize));
    }
    function visibility() {
      motion.setEnvironment({ hidden: document.hidden });
      if (document.hidden) stop();
      else resume();
    }
    function motionChanged() {
      stop();
      motion.setEnvironment({ reducedMotion: media.matches });
      if (media.matches) { actionActive = false; callbacks.onActionChange?.(false); }
      pointerX = pointerY = targetX = targetY = 0;
      render();
      resume();
    }
    function contextLost(event: Event) {
      event.preventDefault();
      fail(new Error("The WebGL rendering context was lost."));
    }
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", motionChanged);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    cleanups.push(() => {
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", motionChanged);
      renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
    });
    resize();
    resume();
  } catch (error) {
    fail(error);
  }
  return controller;
}
