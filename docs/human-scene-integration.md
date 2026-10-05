# Real-time human scenes

## Direction and scope

The latest approved direction uses detailed scan-derived people and a brighter
sunset identity: cream backgrounds, peach sets, amber side light, warm dark text
and burnt-orange interface accents. People themselves use orange satin clothing
and pale amber frosted resin skin/hair. Natural photographic albedo hues are removed;
compressed source luminance and original normal maps preserve subtle relief. The symbol keeps its white solid arc and black dots.

This is an implementation checkpoint. Local tests do not establish actual browser
performance. Publication has separate user authorization and must be verified against
the exact remote commit. No backend schema change or real signup is needed for QA.

## Runtime behavior

- `HumanStory` provides ordinary HTML copy and links, inert inactive panels, matching
  scene-render fallbacks, chapter navigation, pause and explicit retry controls.
- The renderer module waits until the story approaches the viewport. Save-Data
  prevents automatic 3D loading until the reader explicitly chooses “Coba 3D”.
- Phones use 1024px texture variants; desktop uses 2048px variants. The choice is
  made once at renderer creation, including short-landscape phones, so resizing
  never downloads a second tier.
- The learning GLB loads before the remaining two sets. These are actual skinned
  geometry, authored perspective cameras and skeletal animation clips, not video.
- Scroll moves the camera through stages at X = 0, 7 and 14 meters. Mobile framing
  uses the animated first pose rather than the unposed rig's bounds.
- Reduced-motion readers keep matching static posters without importing Three or
  fetching models. A live preference change disposes the active renderer. Chapter
  controls and content remain usable. Pause suppresses gestures; hidden tabs and
  offscreen stories suspend the frame loop.
- WebGL context loss returns to the current poster and enables a clean retry.
- Abort signals, observer/listener removal, mixer cleanup and resource disposal cover
  unmount and failed loads. Geometry, materials, textures, decoded image bitmaps,
  bone textures, shadow maps and the environment target are released.
- Amber human materials and sunset lighting are authored in the assets. The runtime
  preserves those imported albedo, normal, roughness, transmission and clearcoat
  properties rather than overwriting them with a flat tint.
- Mobile canvas/poster and copy occupy separate bands. A short-landscape layout and
  44px controls remain available. No-JavaScript hides inert controls and collapses
  the scroll journey to its usable first chapter.

## Files

- `src/components/HumanStory.tsx`: content, lazy import, scroll, accessibility, fallback.
- `src/lib/human-scenes.ts`: glTF loading, camera, mixers, framing, lights, disposal.
- `src/app/interface.css`: warm modern public interface and responsive layout.
- `public/models/{learning,business,collaboration}.glb`: actual runtime scene assets.
- `public/models/{learning,business,collaboration}-mobile.glb`: matching mobile tier.
- `public/scenes/{learning,business,collaboration}.webp`: renders of those exact sets.
- `public/models/asset-provenance.json`: source, license, asset and export evidence.

## Asset contract

1. Source licensing must permit public downloadable client-side glTF delivery and
   repository inclusion where applicable. Optimization is not access protection.
2. Export in meters, Y-up, near local X = 0. Only the runtime adds the stage spacing.
3. Include an authored perspective camera that leaves space at the left for desktop
   copy. Do not add a giant floor or distant invisible objects to framing bounds.
4. Use the approved 89-joint scan rigs: three actors for learning, two for business,
   two for collaboration. Keep detailed normal maps and the approved amber material hierarchy.
5. Include subtle compatible looping clips, one per rig or equivalent scene-wide
   motion. All exported clips play together, so alternative takes must be excluded.
6. Sample the authored first pose before deriving bounds. Runtime floor Y = -0.012.
7. Embed model/texture data; no external asset URLs or credentials. The existing
   loader supports Meshopt geometry compression and WebP textures.
8. Render posters from the matching scenes and lighting. Concept images are not
   substitutes for exported runtime models or evidence of their actual appearance.
9. Measure download size, triangles, textures and real mobile performance after each
   replacement. Do not infer a performance guarantee from compression alone.

## Verification

Final checks must run after the last material/export change. See the exact-commit
verification record for test count, bundle sizes and deployment state.

`npm test` covers actual GLTFLoader/Meshopt decoding and skeletal motion when the
exported assets are present. DOM/runtime tests use real Three math, skeletons and
AnimationMixers, with renderer/network/bitmap decoding mocked as described in the
test files. They do not establish browser layout, image pixels or GPU performance.

Run `npm run typecheck` and `npm run build` against the final exported files. There
is no separate lint script. `src/types/three-local.d.ts` remains a narrow explicit
Three r180 API subset because the official type package was unavailable. No blanket
`any` module declaration or compiler suppression is used.

Browser and real-device checks should cover all chapters, desktop and phone framing,
short landscape, reduced motion, Save-Data opt-in, failed loads/retry, pause, context
loss, navigation and signup validation without submitting a real registration.

## Final asset verification — 2026-10-05

All six corrected amber assets pass real-loader, rig, first-pose ground-contact,
motion, material-factor, camera and texture-tier tests. The local suite has 63 tests.
Normals use near-lossless WebP with measured mean angular error 0.744–0.902 degrees
and p95 2.058–2.254 degrees against losslessly resized source maps. Encoded and decoded
GLB validation reports zero errors; inherited non-root skin-layout warnings remain.

Desktop scene downloads total 21466684 bytes; mobile scene downloads total 7496760 bytes.
These are total asset payloads, not measured browser speed or memory promises. First
scene loads before the others, and all three current posters together are under 250 KB.

The final lighting revision uses a dominant low-angle sunset side key, restrained
ambient/environment intensity, a soft low-power fill and a thin warm rim. Exposure
is reduced to retain amber shadow depth and localized material highlights; the floor
is matte to avoid broad softbox reflections. Browser lighting is still checked from
the actual deployment rather than inferred from Blender renders.
