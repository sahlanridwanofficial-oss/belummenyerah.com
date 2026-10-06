# Private social content review

`/admin/sosial` is the owner-only Instagram/Threads draft and review dashboard. It reuses `getAdminContext()` and the live current-owner `is_admin()` guard.

## Available

- Save private Instagram carousel outlines and Threads text drafts with source notes.
- Append immutable revisions rather than overwrite reviewed content.
- Review up to 50 selected items in one hash/version-bound batch. Approval is for content only.
- Save separate creation and per-platform publishing preferences, with an explicit timezone.

Provider stays disabled and both schedule flags stay paused in the database and application. No worker, OAuth, credential, model service, asset upload, provider scheduling, or publishing endpoint is included. Slide outlines are not rendered final assets. Changing these restrictions requires a separately reviewed and authorized integration.

## Database

Migration `20261006185903_social_content_review_owner_only` was applied on 2026-10-06. It adds six RLS-enabled tables, SELECT-only owner-scoped client reads, and four checked authoring/review/settings RPCs. Public wrappers are invokers; narrow private implementations perform the owner checks and transactional writes. Raw client writes, anonymous access and direct service-role access are not granted.

`social_private` must stay outside the Data API exposed-schema list. No allowlist identity was added. All six social tables were empty after the release's rollback-only live verification.

## Verification

- Feature authorization, validation, action-response checks, escaped rendering and 51/100-draft selection regressions are in `tests/social-admin.test.cjs`.
- Navigation regressions are in `tests/social-navigation.test.cjs`.
- Real in-memory PostgreSQL tests are in `tests/database/social-security.test.mjs`; use a separately installed official PGlite 0.5.8 package through `PGLITE_MODULE` or an available test dependency. PGlite is not an application dependency. These fixtures do not authenticate through Supabase Auth.
- The actual PostgreSQL 17.6 schema catalog, table/function grants, RLS policies and owner guard were checked after migration.
- Rollback-only live SQL role tests exercised the existing owner's draft → approval → revision flow, stale-approval rejection, direct-write denial, paused settings, and anonymous/non-owner denials. No test content or schedule persisted.

These SQL-role tests do not prove the owner's browser session or real JWT/PostgREST workflow. Verify the deployed owner UI, live save/read round-trip and separate-session conflicts before calling the entire authenticated workflow end-to-end verified. Do not create extra users or persistent test records without an approved scope.

## Recovery

An unavailable database or missing guard fails closed. A failed app release can revert the scoped UI/navigation commit while preserving restrictive database access and stored revisions. Do not automatically drop tables, erase history or undo owner hardening.
