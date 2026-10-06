/**
 * Narrow declarations for the Three r180 APIs used by the real-time scenes and original Bekal model.
 * The official @types/three tarball was unavailable (HTTP 403) in this environment.
 * These declarations are checked against installed runtime exports and scene tests.
 * Replace this file with matching official declarations when registry access returns.
 * No blanket `any` module declaration or compiler suppression is used.
 */
declare module "three" {
  export const SRGBColorSpace: string;
  export const BackSide: number;
  export const DoubleSide: number;
  export const ACESFilmicToneMapping: number;
  export const PCFSoftShadowMap: number;
  export const MathUtils: { degToRad: (degrees: number) => number };
  export class Color {
    r:number; g:number; b:number;
    constructor(color?: ColorRepresentation);
    set(color: ColorRepresentation): this;
    copy(color: Color): this;
    lerp(color: Color, alpha: number): this;
  }
  export class Quaternion {
    setFromUnitVectors(from: Vector3, to: Vector3): this;
    copy(value: Quaternion): this;
    slerpQuaternions(a: Quaternion, b: Quaternion, t: number): this;
  }
  export class Fog {
    constructor(color: ColorRepresentation, near?: number, far?: number);
    color: Color;
  }
  export class Box3 {
    setFromObject(object: Object3D): this;
    getCenter(target: Vector3): Vector3;
    getSize(target: Vector3): Vector3;
  }
  export class AnimationClip {
    name: string;
    duration: number;
  }
  export class AnimationAction {
    play(): this;
  }
  export class AnimationMixer {
    constructor(root: Object3D);
    clipAction(clip: AnimationClip): AnimationAction;
    update(delta: number): this;
    setTime(time: number): this;
    stopAllAction(): this;
    uncacheRoot(root: Object3D): void;
  }
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    clone(): Vector3;
    copy(v: Vector3): this;
    add(v: Vector3): this;
    addScaledVector(v: Vector3, s: number): this;
    multiplyScalar(s: number): this;
    normalize(): this;
    setScalar(s: number): this;
    lerpVectors(a: Vector3, b: Vector3, alpha: number): this;
  }
  export class Euler {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
  }
  export class Object3D {
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    quaternion: Quaternion;
    visible: boolean;
    name: string;
    updateMatrixWorld(force?: boolean): void;
    getWorldPosition(target: Vector3): Vector3;
    getWorldQuaternion(target: Quaternion): Quaternion;
    getWorldDirection(target: Vector3): Vector3;
    add(...objects: Object3D[]): this;
    traverse(callback: (object: Object3D) => void): void;
  }
  export class Group extends Object3D {}
  export class Texture {
    source: { data: unknown };
    dispose(): void;
  }
  export class Scene extends Object3D {
    environment: Texture | null;
    environmentIntensity: number;
    background: Color | null;
    fog: Fog | null;
  }
  export class Camera extends Object3D {
    lookAt(x: number, y: number, z: number): void;
    lookAt(target: Vector3): void;
  }
  export class PerspectiveCamera extends Camera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    aspect: number;
    fov: number;
    far: number;
    updateProjectionMatrix(): void;
  }
  export class BufferAttribute {
    count: number;
    array: ArrayLike<number>;
    needsUpdate: boolean;
    setX(index:number,x:number):this;
    setXYZ(index: number, x: number, y: number, z: number): this;
  }
  export class Uint16BufferAttribute extends BufferAttribute { constructor(array:ArrayLike<number>,itemSize:number); }
  export class Float32BufferAttribute extends BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
  }
  export class BufferGeometry {
    clone():BufferGeometry;
    drawRange:{start:number;count:number};
    setDrawRange(start:number,count:number):void;
    index:BufferAttribute|null;
    computeBoundingSphere():void;
    attributes: Record<string, BufferAttribute>;
    setAttribute(name: string, attribute: BufferAttribute): this;
    setIndex(index: number[]|BufferAttribute): this;
    computeVertexNormals(): void;
    translate(x: number, y: number, z: number): this;
    dispose(): void;
  }
  export class Shape {
    getPoints(divisions?: number): { x:number; y:number }[];
    bezierCurveTo(a:number,b:number,c:number,d:number,e:number,f:number):this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
  }
  export class EdgesGeometry extends BufferGeometry { constructor(geometry:BufferGeometry,thresholdAngle?:number); }
  export class ShapeGeometry extends BufferGeometry { constructor(shape:Shape,curveSegments?:number); }
  export class CircleGeometry extends BufferGeometry { constructor(radius?:number,segments?:number); }
  export class ExtrudeGeometry extends BufferGeometry {
    constructor(shape: Shape, options?: {
      depth?: number;
      steps?: number;
      bevelEnabled?: boolean;
      bevelSegments?: number;
      bevelSize?: number;
      bevelThickness?: number;
      curveSegments?: number;
    });
  }
  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number);
  }
  export class CatmullRomCurve3 extends Curve<Vector3> {
    constructor(points?: Vector3[], closed?: boolean, curveType?: string, tension?: number);
  }
  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number);
  }
  export class BoxGeometry extends BufferGeometry {
    constructor(
      width?: number,
      height?: number,
      depth?: number,
      widthSegments?: number,
      heightSegments?: number,
      depthSegments?: number,
    );
  }
  export class CylinderGeometry extends BufferGeometry {
    constructor(
      radiusTop?: number,
      radiusBottom?: number,
      height?: number,
      radialSegments?: number,
    );
  }
  export class TorusGeometry extends BufferGeometry {
    constructor(
      radius?: number,
      tube?: number,
      radialSegments?: number,
      tubularSegments?: number,
      arc?: number,
    );
  }
  export class IcosahedronGeometry extends BufferGeometry {
    constructor(radius?: number, detail?: number);
  }
  export class Curve<T extends Vector3> {
    getPoint(t: number, optionalTarget?: T): T;
  }
  export class TubeGeometry extends BufferGeometry {
    constructor(
      path?: Curve<Vector3>,
      tubularSegments?: number,
      radius?: number,
      radialSegments?: number,
      closed?: boolean,
    );
  }
  export type ColorRepresentation = string | number | Color;
  export interface MaterialParameters {
    vertexColors?: boolean;
    depthWrite?: boolean;
    side?: number;
    transparent?: boolean;
    opacity?: number;
  }
  export interface MeshBasicMaterialParameters extends MaterialParameters {
    color?: ColorRepresentation;
  }
  export interface MeshStandardMaterialParameters extends MeshBasicMaterialParameters {
    metalness?: number;
    roughness?: number;
    emissive?: ColorRepresentation;
    emissiveIntensity?: number;
  }
  export interface MeshPhysicalMaterialParameters extends MeshStandardMaterialParameters {
    clearcoat?: number;
    clearcoatRoughness?: number;
  }
  export class Material {
    opacity:number;
    dispose(): void;
  }
  export class MeshBasicMaterial extends Material {
    constructor(parameters?: MeshBasicMaterialParameters);
  }
  export class MeshStandardMaterial extends Material {
    color: Color;
    constructor(parameters?: MeshStandardMaterialParameters);
  }
  export class MeshPhysicalMaterial extends Material {
    constructor(parameters?: MeshPhysicalMaterialParameters);
  }
  export class ShadowMaterial extends Material {
    constructor(parameters?: MaterialParameters & { color?: ColorRepresentation; depthWrite?: boolean });
  }
  export class ShaderMaterial extends Material {
    constructor(parameters?: MaterialParameters & {
      uniforms?: Record<string, { value: number }>;
      vertexShader?: string;
      fragmentShader?: string;
      depthWrite?: boolean;
    });
    uniforms: Record<string, { value: number }>;
  }
  export class PointsMaterial extends Material {
    constructor(
      parameters?: MeshBasicMaterialParameters & {
        size?: number;
        sizeAttenuation?: boolean;
      },
    );
  }
  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material | Material[]);
    geometry: BufferGeometry;
    material: Material | Material[];
    castShadow: boolean;
    receiveShadow: boolean;
  }
  export class Skeleton { update(): void; dispose(): void; }
  export class SkinnedMesh extends Mesh { skeleton: Skeleton; computeBoundingBox(): void; }
  export class Points extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material);
  }
  export class AmbientLight extends Object3D {
    constructor(color?: ColorRepresentation, intensity?: number);
  }
  export class HemisphereLight extends Object3D {
    constructor(
      skyColor?: ColorRepresentation,
      groundColor?: ColorRepresentation,
      intensity?: number,
    );
  }
  export class DirectionalLight extends Object3D {
    target: Object3D;
    castShadow: boolean;
    shadow: {
      dispose(): void;
      mapSize: { set(width: number, height: number): void };
      camera: {
        left: number;
        right: number;
        top: number;
        bottom: number;
        near: number;
        far: number;
      };
      bias: number;
      normalBias: number;
    };
    constructor(color?: ColorRepresentation, intensity?: number);
  }
  export class WebGLRenderTarget {
    texture: Texture;
    dispose(): void;
  }
  export class WebGLRenderer {
    constructor(parameters?: {
      alpha?: boolean;
      antialias?: boolean;
      powerPreference?: "default" | "high-performance" | "low-power";
    });
    domElement: HTMLCanvasElement;
    outputColorSpace: string;
    toneMapping: number;
    toneMappingExposure: number;
    shadowMap: { enabled: boolean; type: number };
    setPixelRatio(value: number): void;
    setClearColor(color: ColorRepresentation, alpha?: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    render(scene: Object3D, camera: Camera): void;
    dispose(): void;
  }
  export class PMREMGenerator {
    constructor(renderer: WebGLRenderer);
    fromScene(scene: Scene, sigma?: number): WebGLRenderTarget;
    dispose(): void;
  }
}
declare module "three/addons/environments/RoomEnvironment.js" {
  import { Scene } from "three";
  export class RoomEnvironment extends Scene {
    dispose(): void;
  }
}

declare module "three/addons/loaders/GLTFLoader.js" {
  import { Group, Camera, AnimationClip } from "three";
  import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
  export interface GLTF {
    scene: Group;
    cameras: Camera[];
    animations: AnimationClip[];
  }
  export class GLTFLoader {
    setMeshoptDecoder(decoder: typeof MeshoptDecoder): this;
    parseAsync(data: ArrayBuffer | string, path: string): Promise<GLTF>;
  }
}
declare module "three/addons/libs/meshopt_decoder.module.js" {
  export const MeshoptDecoder: {
    supported: boolean;
    ready: Promise<void>;
    decodeGltfBuffer(
      target: Uint8Array,
      count: number,
      size: number,
      source: Uint8Array,
      mode: string,
      filter?: string,
    ): void;
  };
}
