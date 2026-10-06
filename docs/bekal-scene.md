# Bekal: original real-time character

The current homepage is one concise paper-and-ink composition. Original hand-drawn lettering reads “Don’t give up”. Bekal is a custom folded-book companion with a cream tote, authored entirely as Three.js geometry. No external mascot, font artwork, scanned person, video, model, or texture is downloaded.

## Structure
- `DontGiveUpTitle.tsx`: original inline SVG letter paths with an accessible HTML heading.
- `BekalFallback.tsx`: original inline SVG illustration, also present in server HTML.
- `BekalScene.tsx`: lazy runtime, reduced-motion/Save-Data opt-in, visibility, pause and retry controls.
- `bekal-model.ts`: custom beveled shapes, tubes, shoes and face; deterministic bounded poses.
- `bekal-scene.ts`: lighting, transparent WebGL, responsive camera, capped DPR, contact shadows, complete resource cleanup.

The scene responds to pointer movement and “Sapa Bekal” with a short wave and hop. Pause is keyboard accessible. Reduced motion defaults to a still; explicit opt-in renders a still WebGL frame without perpetual movement. Lost/unavailable contexts retain the illustration. The illustration is a fallback, never represented as a running 3D scene.

## Content boundaries
The homepage links to free classes and About. Article routes are reversibly paused in `src/app/blog/_visibility.ts` before queries. Their data, admin editor and source remain intact. The public sitemap omits articles. Courses keep actual catalog data, browser-local progress and original signup APIs. Tests never send real email.

## Verification
Run `npm test`, `npm run typecheck`, `npm run build` and `git diff --check`. Geometry and controller tests exercise actual Three objects with only the renderer stubbed. Browser visual/GPU checks must be reported separately. Cloud browser WebGL is disabled; a conventional Blender render of exported geometry is a model proof, not proof of live browser performance.

The repository retains a narrow explicit local Three declaration because the official type-package retrieval was blocked earlier. Do not describe typechecking as validation against the full upstream declaration package.
