# Owner-only access: reviewed structural template

Production database migration `20261006184949_restrict_editor_access_to_verified_owner` was applied on 2026-10-06 with a separately verified existing owner binding before restrictive policies. Read-only PostgreSQL 17.6 owner/non-owner/anonymous checks passed. Existing records were retained. No owner identity is embedded in this source template. Public Auth signup settings are separate and are not claimed changed by this migration.

## Rollout and verification procedure

1. Verify the intended owner's existing, confirmed Auth account. Do not infer ownership from an email address, display name, or the fact that only one account exists.
2. Obtain approval for the exact security changes. Recheck the live policy inventory, PostgreSQL version, existing functions, and grants. The observed target was PostgreSQL 17.6 with 14 policies across the seven existing public tables and no private schema or is_admin function.
3. Close public Auth account signup through the approved settings workflow. This is separate from newsletter/course signup RPCs, which remain available.
4. Apply the reviewed structural SQL and verified membership binding through a privileged connection. Prefer one reviewed transaction containing both structural changes and the separately verified seed, so there is no unintended owner-lockout interval. The checked-in seed template intentionally contains an invalid placeholder and defaults to ROLLBACK. Never publish the resolved account UUID in source.
5. Verify the owner can call public.is_admin() successfully and access existing records. Verify a non-owner and anonymous client cannot access subscriber/archive data or mutate content, while published courses and existing newsletter/course RPCs still work. Use disposable test data or rollback-safe checks where writes need verification.
6. Only then deploy the app guards and retest login, admin pages, actions, and the newsletter-send authorization boundary without sending live mail. Missing membership/RPC/configuration fails closed.

## Security model

- private.admin_users has no client table grants or client RLS policies.
- private.is_admin() is a narrow SECURITY DEFINER lookup with an empty search_path, qualified names, and auth.uid() membership. It returns only the caller's own boolean; editable user_metadata is ignored.
- public.is_admin() is a SECURITY INVOKER wrapper callable by authenticated clients only. The app first verifies the user with getUser(), then requires the RPC value to be exactly true.
- Existing authenticated editor policies become owner-only. Published course/module/lesson SELECT policies remain unchanged. Anonymous legacy article access is removed without deleting records.
- Client TRUNCATE/REFERENCES/TRIGGER grants are removed because RLS does not govern those operations. Authenticated clients retain RLS-governed CRUD; anonymous clients retain course reads. Existing SECURITY DEFINER subscription RPCs are unchanged.
- The proposal compares the complete reviewed policy inventory, including names, tables, roles, commands, permissiveness, predicates and checks; same-count predicate changes are rejected. Re-audit on any drift; do not weaken checks to force application.

## Offline verification

App tests: npm test, npm run typecheck, npm run build.

The separate tests/database/owner-security.test.mjs harness executes the exact proposal against the original two migrations in an isolated in-process PostgreSQL engine. It uses fake UUIDs and a test auth.uid() claim stub. It does not create live accounts, connect to Supabase, test JWT signature verification, or exercise PostgREST.

Install @electric-sql/pglite@0.5.8 in a separate disposable directory, then run:

PGLITE_MODULE=/absolute/path/to/node_modules/@electric-sql/pglite/dist/index.js node --test tests/database/owner-security.test.mjs

Verified engine: PostgreSQL 18.3 (PGlite 0.5.8), distinct from the live target 17.6. The fixture omits only the unavailable pgcrypto extension declaration; gen_random_uuid() is built into PostgreSQL. Both original schema/RPC/policy migrations and the new proposal otherwise execute unchanged. The tests cover empty membership, anon/non-owner denial, owner CRUD, private allowlist isolation, public course reads, subscription RPC continuity, revoked membership, and nested SECURITY DEFINER caller identity. Production PostgreSQL 17.6 role/claim checks passed after application. Actual Auth sessions, PostgREST and authenticated-browser checks are distinct from those SQL role checks and should still be verified in the relevant deployment workflow.

## Rollback readiness

The app rollback baseline is commit 6d11378055c474f0529d6e02559827a7bc032c18. If the UI regresses, roll back or forward-fix only the app; keep the database restriction intact. Never restore broad authenticated access or public legacy-archive reads as an automatic rollback. No stored content was deleted. Membership correction, if ever needed, requires verification of the intended account and explicit approval.
