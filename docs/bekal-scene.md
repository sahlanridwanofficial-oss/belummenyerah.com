# Shared effort: illustrated background world

The accepted homepage lettering, copy, menu, colors, dimensions, grid footprint and links are preserved. Only the illustration is a full-page, pointer-transparent layer behind that foreground. There are no animation buttons.

## Original scene
- `CrowdScene.tsx` retains the existing scene footprint and note. A portal moves only the art behind the page. Reduced-motion and Save-Data preferences use a still; failed GPU initialization also keeps that still.
- `crowd-story.ts` authors a 24-second continuous narrative: three initial supporters strain under the rock, fifteen helpers walk from separate distant positions and join at staggered times, the group lifts, then helpers walk back. Eighteen other people stay dispersed as walkers and small idle groups. The loop boundary does not teleport people.
- `illustrated-crowd-model.ts` uses original flat illustrated silhouettes, articulated stepping, varied proportions, charcoal hair/caps, mostly paper/gray fills and limited butter-yellow accents. Original arm silhouettes transition to a supporting pose. Texture-free analytic soft shadows follow every person; a broad boulder shadow moves and softens with its lift.
- `illustrated-rock.ts` creates an asymmetrical near-white volumetric boulder, continuous ink contour, face shading and original surface hatching.
- `illustrated-crowd-scene.ts` renders the world with an oblique camera, a roughly 44-degree authored orbit and inward reframe. The camera clipping range adapts to narrow viewports. Geometry/materials are shared where possible, deforming buffers are preallocated, and rendering is capped at 30 fps with mobile DPR capped at 1. Rendering pauses in hidden tabs and outside the viewport; disposal releases resources.

No reference art, downloaded character model, video hero, third-party tracking or external scene asset fetch is used. The older scene modules remain as unused historical source.

## Boundaries and verification

Free classes and About remain the main homepage links. Article routes remain reversibly hidden; database/admin content is untouched. Signup API endpoints and browser-local progress are unchanged. Tests do not send email.

Run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check`. SHA-locked tests preserve the accepted foreground files and CSS prefix. Story tests cover staggered arrival, supported lift, continuous return paths, articulated gait, stable unsupported faces, preference races, disposal and portrait near/far clipping. Mocked rendering tests do not establish browser pixels or GPU performance.

The offline proof is rendered from the actual scene geometry and poses using Blender. It is animation-only, at a reduced proof frame rate, and is not a screenshot of the integrated website. Browser/device appearance and foreground readability still require a real browser review before publication. Local Three declarations cover the used APIs rather than full upstream type declarations.

## Optional scene sound

`crowd-audio.ts` synthesizes original filtered-noise Foley locally: soft footsteps triggered by the same distance/phase as the visible gait, and a low rock-friction layer driven by vertical movement and strain. No music, samples, external requests or extra dependencies. The renderer forwards its paused scene clock; audio never runs a separate animation clock or catches up missed steps.

Sound unlocks only after a trusted pointer/keyboard interaction while the animation is ready. A separate 44px accessible speaker toggle enables or mutes it without moving the accepted grid. Mute preference is stored locally when storage is available. Reduced motion, Save-Data, WebGL failure, offscreen/hidden state and unsupported Web Audio remain silent. Context suspension, short bounded voices, rejected resume handling, listener removal and idempotent disposal are covered by tests. Tests verify lifecycle and generated signal; they do not prove the sound heard on a physical device.
