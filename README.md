# Belum Menyerah

Bekal belajar gratis untuk UMKM. Next.js App Router, React, Supabase, dan Resend.

## Run

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Copy `.env.example` to `.env.local` and use the existing project values. Never commit secrets. Without Supabase configuration, course pages show their honest empty/unavailable state. Do not submit live signup forms in automated tests.

## Current interface

The homepage is a concise off-white/ink/yellow design with original hand-drawn “Don’t give up” lettering and Bekal, an original procedural Three.js folded-book character. Free classes and About are the two main paths. Article routes are reversibly paused before data access; the admin and database content remain intact. See [scene implementation](docs/bekal-scene.md).

Newsletter and course subscriptions retain their separate API endpoints and duplicate/error/success behavior. Course progress remains browser-local. No cash calculator, downloaded human models, video hero or third-party tracking is used on the homepage.

## Deployment

The project publishes through its connected GitHub → Vercel integration. Verify the exact remote SHA and Vercel build before reporting publication. Keep security settings unchanged. Local screenshots/model renders do not prove live GPU animation.

## Data setup

Existing Supabase SQL and configuration are in the repository. All writes and migrations must be deliberate; a UI refresh does not require changing or deleting stored content.
