# Shared effort: original real-time crowd

The accepted paper/ink/yellow page composition and original hand-drawn “Don’t give up” lettering remain. Seven original soft-bodied figures jointly support an oversized faceted boulder. No external character model, game asset, video or scanned person is used.

## Structure
- `DontGiveUpTitle.tsx`: original inline SVG letter paths with an accessible heading.
- `CrowdScene.tsx`: deferred runtime, still fallback, reduced-motion/Save-Data opt-in, pause, accessible help control and context-loss recovery.
- `crowd-model.ts`: original geometry; analytic two-bone limb posing keeps feet planted and palms in contact with the shared rock.
- `crowd-scene.ts`: authored collective effort/lift/hold/recovery, camera reveal/arc, lighting, capped DPR and resource cleanup.
- `bekal-motion.ts`: renderer-independent deterministic phase clock, safe intent coalescing and authored pose tracks.
- `public/scenes/crowd-still.webp`: conventional render of the actual crowd geometry. It is a fallback, not represented as running WebGL.

The “Bantu angkat” button starts a clear shared lift after a brief preparation. Characters have staggered effort, recovery and glancing motion. Scene/camera motion pauses offscreen and in hidden tabs. Reduced motion defaults to the still; explicit opt-in renders stable 3D without continuous movement. All poses are absolute and bounded, preventing cumulative drift.

## Content boundaries
Free classes and About remain the two main homepage paths. Article routes are reversibly paused before queries in `src/app/blog/_visibility.ts`; the database, admin editor and original article source remain intact. The sitemap omits articles. Signup API endpoints and browser-local course progress are unchanged. Tests do not send real email.

## Verification
Run `npm test`, `npm run typecheck`, `npm run build` and `git diff --check`. Model tests use actual Three geometry and world-space hand/rock contact checks. Controller/DOM tests mock the renderer and network; they cannot establish pixel output or actual GPU performance. Keep browser/device QA results separate.

The local Three declaration is an explicit subset of APIs actually used; official upstream types were not available in the earlier package retrieval. Do not claim full upstream type declaration coverage.
