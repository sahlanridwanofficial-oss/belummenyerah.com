import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite");
import { fixtureSql, OWNER, OTHER_ADMIN, NON_ADMIN, REVOKED_OWNER } from "./social-fixtures.mjs";

const TABLES = ["social_settings", "social_accounts", "social_posts", "social_post_revisions", "social_content_approvals", "social_dispatch_jobs"];
const OWN_ACCOUNT = "50000000-0000-4000-8000-000000000005";
const OTHER_ACCOUNT = "60000000-0000-4000-8000-000000000006";
const json = (value) => JSON.stringify(value);
const item = (revision) => ({ post_id: revision.post_id, revision: revision.revision, content_sha256: revision.content_sha256 });

test("actual PostgreSQL/WASM schema, grants, RLS, and transactional RPCs (stub Auth)", async (t) => {
  const db = await PGlite.create(); // Pure memory, no file database, network, or socket.
  const rows = async (sql, params = []) => (await db.query(sql, params)).rows;
  const scalar = async (sql, params = []) => Object.values((await rows(sql, params))[0])[0];
  const asRole = async (role, owner = null) => {
    assert.ok(["postgres", "anon", "authenticated", "service_role"].includes(role));
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [owner ?? ""]);
    if (role !== "postgres") await db.exec(`set role ${role}`);
  };
  const create = (patch = {}) => {
    const p = { platform: "threads", account: null, title: "Draf pengujian", text: "Langkah kecil hari ini.", slides: [], sources: ["Test fixture only"], ...patch };
    return scalar("select public.social_create_draft($1,$2::uuid,$3,$4,$5::jsonb,$6::jsonb)",
      [p.platform, p.account, p.title, p.text, json(p.slides), json(p.sources)]);
  };
  const revise = (revision, patch = {}) => {
    const p = { title: revision.title, text: revision.text + " Revisi.", slides: revision.slides, sources: revision.sources, ...patch };
    return scalar("select public.social_revise_draft($1::uuid,$2::integer,$3,$4,$5::jsonb,$6::jsonb)",
      [revision.post_id, revision.revision, p.title, p.text, json(p.slides), json(p.sources)]);
  };
  const approve = (items) => scalar("select public.social_approve_batch($1::jsonb)", [json(items)]);
  const settings = (value = {}, version = 0) => scalar("select public.social_save_settings($1::jsonb,$2::bigint)", [json(value), version]);
  const rejects = async (fn, code, message) => assert.rejects(fn, (error) => {
    assert.equal(error.code, code, `${message ?? "SQLSTATE"}: ${error.message}`);
    return true;
  });
  let ownerDraft, otherDraft, ownerApproval, otherApproval;

  try {
    await db.exec(fixtureSql);
    await t.test("draft parses and applies without rewriting any migration statement", async () => {
      await db.exec(await readFile(new URL("../../supabase/migrations/20261006185903_social_content_review_owner_only.sql", import.meta.url), "utf8"));
      const version = await scalar("select version()");
      assert.match(version, /PostgreSQL 18\.3 \(PGlite 0\.5\.8\)/);
      t.diagnostic(version);
      assert.equal(await scalar("select count(*)::int from pg_tables where schemaname='public' and tablename like 'social_%'"), 6);
    });

    await t.test("all six actual table catalogs enforce RLS and SELECT-only authenticated grants", async () => {
      for (const table of TABLES) {
        assert.equal(await scalar("select relrowsecurity from pg_class where oid=$1::regclass", [`public.${table}`]), true);
        assert.equal(await scalar("select has_table_privilege('authenticated',$1,'SELECT')", [`public.${table}`]), true);
        for (const role of ["anon", "authenticated", "service_role"]) {
          for (const op of ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]) {
            assert.equal(await scalar("select has_table_privilege($1,$2,$3)", [role, `public.${table}`, op]), false);
          }
        }
        assert.equal(await scalar("select count(*)::int from pg_policies where schemaname='public' and tablename=$1 and cmd='SELECT'", [table]), 1);
      }
    });

    await t.test("public wrappers are invokers and private write functions have fixed paths", async () => {
      const funcs = await rows("select n.nspname,p.proname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='public' and p.proname like 'social_%') or (n.nspname='social_private' and p.proname in ('create_draft','revise_draft','approve_batch','save_settings'))");
      assert.equal(funcs.length, 8);
      for (const f of funcs) {
        assert.equal(f.prosecdef, f.nspname === "social_private");
        assert.deepEqual(f.proconfig, ['search_path=""']);
      }
    });

    await t.test("allowed owners author and content-review their own drafts through real RPCs", async () => {
      await asRole("authenticated", OWNER);
      assert.equal(await scalar("select public.is_admin()"), true);
      ownerDraft = await create();
      assert.equal(ownerDraft.owner_user_id, OWNER);
      assert.equal(ownerDraft.revision, 1);
      assert.match(ownerDraft.content_sha256, /^[a-f0-9]{64}$/);
      ownerApproval = (await approve([item(ownerDraft)]))[0];
      assert.equal(ownerApproval.scope, "content_only");
      assert.equal(ownerApproval.target_account_id, null);
      const row = await settings();
      assert.equal(row.settings.timezoneConfirmed, false);
      assert.equal(row.settings.publishing.monthlyNetworkPostCap, 16);
      await asRole("authenticated", OTHER_ADMIN);
      otherDraft = await create({ title: "Other owner's test draft" });
      otherApproval = (await approve([item(otherDraft)]))[0];
      await settings();
    });

    await t.test("test-only metadata/blocked jobs seed positive RLS coverage for every table", async () => {
      await asRole("postgres");
      await db.query("insert into public.social_accounts(id,owner_user_id,platform,display_handle) values ($1,$2,'instagram','@test-owner'),($3,$4,'instagram','@test-other')", [OWN_ACCOUNT, OWNER, OTHER_ACCOUNT, OTHER_ADMIN]);
      for (const a of [ownerApproval, otherApproval]) {
        await db.query("insert into public.social_dispatch_jobs(owner_user_id,approval_id,post_id,revision,content_sha256,idempotency_key) values ($1,$2,$3,$4,$5,$6)",
          [a.owner_user_id, a.id, a.post_id, a.revision, a.content_sha256, `TEST-ONLY-BLOCKED:${a.id}`]);
      }
      assert.equal(await scalar("select count(*)::int from public.social_dispatch_jobs"), 2);
    });

    await t.test("SET ROLE authenticated applies owner filtering on every populated table", async () => {
      for (const owner of [OWNER, OTHER_ADMIN]) {
        await asRole("authenticated", owner);
        assert.equal(await scalar("select current_user"), "authenticated");
        for (const table of TABLES) {
          const visible = await rows(`select owner_user_id from public.${table}`);
          assert.ok(visible.length > 0, `${table} has positive owned fixture coverage`);
          assert.ok(visible.every((row) => row.owner_user_id === owner), `${table} hides other owner`);
        }
      }
      await rejects(() => revise(ownerDraft), "42501");
      await rejects(() => approve([item(ownerDraft)]), "42501");
    });

    await t.test("non-allowlisted and missing-claim callers cannot read or call any write RPC", async () => {
      for (const caller of [NON_ADMIN, null]) {
        await asRole("authenticated", caller);
        assert.equal(await scalar("select public.is_admin()"), false);
        for (const table of TABLES) assert.deepEqual(await rows(`select * from public.${table}`), []);
        await rejects(() => create(), "42501");
        await rejects(() => revise(ownerDraft), "42501");
        await rejects(() => approve([item(ownerDraft)]), "42501");
        await rejects(() => settings(), "42501");
      }
    });

    await t.test("anon cannot read any table or execute any public write RPC", async () => {
      await asRole("anon");
      for (const table of TABLES) await rejects(() => rows(`select * from public.${table}`), "42501");
      await rejects(() => create(), "42501");
      await rejects(() => revise(ownerDraft), "42501");
      await rejects(() => approve([item(ownerDraft)]), "42501");
      await rejects(() => settings(), "42501");
    });

    await t.test("all raw client writes are denied even to allowed owners and service_role", async () => {
      for (const role of ["anon", "authenticated", "service_role"]) {
        await asRole(role, OWNER);
        for (const table of TABLES) {
          await rejects(() => db.exec(`insert into public.${table} default values`), "42501", `${role} insert ${table}`);
          await rejects(() => db.exec(`update public.${table} set owner_user_id=owner_user_id`), "42501", `${role} update ${table}`);
          await rejects(() => db.exec(`delete from public.${table}`), "42501", `${role} delete ${table}`);
        }
      }
    });

    await t.test("account references reject foreign owner, platform mismatch, and nonexistent metadata", async () => {
      await asRole("authenticated", OWNER);
      const valid = await create({ platform: "instagram", account: OWN_ACCOUNT, slides: ["One", "Two"] });
      const approval = (await approve([item(valid)]))[0];
      assert.equal(approval.target_account_id, OWN_ACCOUNT);
      assert.equal(approval.target_platform, "instagram");
      await rejects(() => create({ platform: "instagram", account: OTHER_ACCOUNT, slides: ["One", "Two"] }), "42501");
      await rejects(() => create({ account: OWN_ACCOUNT }), "42501");
      await rejects(() => create({ account: "77777777-7777-4777-8777-777777777777" }), "42501");
    });

    await t.test("content validators accept Unicode codepoint boundaries and reject malformed payloads", async () => {
      await asRole("authenticated", OWNER);
      assert.equal((await create({ title: "x".repeat(160), text: "🙂".repeat(500) })).revision, 1);
      assert.equal((await create({ platform: "instagram", text: "x".repeat(2200), slides: ["x".repeat(1000), "Two"] })).revision, 1);
      const bad = [
        { platform: "facebook" }, { title: "" }, { title: "x".repeat(161) }, { text: "   " }, { text: null },
        { text: "🙂".repeat(501) }, { slides: ["unexpected"] }, { slides: null },
        { platform: "instagram", slides: ["only-one"] }, { platform: "instagram", slides: ["one", ""] },
        { platform: "instagram", slides: ["x".repeat(1001), "two"] },
        { sources: [] }, { sources: Array(11).fill("source") }, { sources: [null] }, { sources: ["x".repeat(1001)] },
      ];
      for (const patch of bad) await rejects(() => create(patch), "22023", json(patch).slice(0,80));
    });

    await t.test("exact batch approvals are idempotent and cannot approve stale or wrong content", async () => {
      await asRole("authenticated", OWNER);
      assert.deepEqual(await approve([item(ownerDraft)]), [ownerApproval]);
      await rejects(() => approve([{ ...item(ownerDraft), content_sha256: "0".repeat(64) }]), "40001");
      await rejects(() => approve([{ ...item(ownerDraft), revision: 999 }]), "40001");
      await rejects(() => approve([item(ownerDraft), item(ownerDraft)]), "22023");
      await rejects(() => approve([]), "22023");
      await rejects(() => approve(Array(51).fill(item(ownerDraft))), "22023");
      await rejects(() => approve([{ ...item(ownerDraft), publish: true }]), "22023");
      await rejects(() => approve([{ post_id: ownerDraft.post_id, revision: ownerDraft.revision }]), "22023");
    });

    await t.test("mixed approval failure rolls back the already-processed valid member", async () => {
      await asRole("authenticated", OWNER);
      const [first, last] = [await create(), await create()].sort((a,b) => a.post_id.localeCompare(b.post_id));
      await rejects(() => approve([item(first), { ...item(last), content_sha256: "0".repeat(64) }]), "40001");
      assert.equal(await scalar("select count(*)::int from public.social_content_approvals where post_id=any($1::uuid[])", [[first.post_id,last.post_id]]), 0);
      assert.equal((await approve([item(last),item(first)])).length, 2);
    });

    await t.test("edits append versions, preserve approved snapshots, and invalidate current review", async () => {
      await asRole("authenticated", OWNER);
      const next = await revise(ownerDraft);
      assert.equal(next.revision, 2);
      assert.notEqual(next.content_sha256, ownerDraft.content_sha256);
      assert.deepEqual(await scalar("select to_jsonb(r) from public.social_post_revisions r where post_id=$1 and revision=1", [ownerDraft.post_id]), ownerDraft);
      assert.equal(await scalar("select current_revision from public.social_posts where id=$1", [ownerDraft.post_id]), 2);
      assert.equal(await scalar("select count(*)::int from public.social_content_approvals where post_id=$1 and revision=2", [ownerDraft.post_id]), 0);
      await rejects(() => revise(ownerDraft), "40001");
      await rejects(() => approve([item(ownerDraft)]), "40001");
      ownerDraft = next;
    });

    await t.test("immutable revisions/approvals/account targets reject privileged updates and deletes", async () => {
      await asRole("postgres");
      for (const table of ["social_post_revisions", "social_content_approvals", "social_accounts"]) {
        await rejects(() => db.query(`update public.${table} set owner_user_id=owner_user_id where owner_user_id=$1`, [OWNER]), "55000");
        await rejects(() => db.query(`delete from public.${table} where owner_user_id=$1`, [OWNER]), "55000");
      }
      const changes = ["platform='instagram'", `account_id='${OWN_ACCOUNT}'`, `owner_user_id='${OTHER_ADMIN}'`, "current_revision=100", "created_at=now()+interval '1 day'"];
      for (const change of changes) await rejects(() => db.query(`update public.social_posts set ${change} where id=$1`, [ownerDraft.post_id]), "55000");
      await rejects(() => db.query("update public.social_posts set current_revision=current_revision+1 where id=$1", [ownerDraft.post_id]), "23503");
    });

    await t.test("hash function is stable and binds every immutable snapshot field", async () => {
      await asRole("postgres");
      const hash = (values) => scalar("select social_private.revision_hash($1::uuid,$2::integer,$3,$4::uuid,$5,$6,$7::jsonb,$8::jsonb)", values);
      const values = [ownerDraft.post_id, ownerDraft.revision, "threads", null, ownerDraft.title, ownerDraft.text, json(ownerDraft.slides), json(ownerDraft.sources)];
      const original = await hash(values);
      assert.equal(original, ownerDraft.content_sha256);
      assert.equal(await hash(values), original);
      const replacements = [OTHER_ADMIN, 10, "instagram", OWN_ACCOUNT, "Changed title", "Changed text", json(["Changed slide"]), json(["Changed source"])];
      for (let i=0; i<values.length; i++) {
        const changed = [...values]; changed[i]=replacements[i];
        assert.notEqual(await hash(changed), original, `snapshot field ${i}`);
      }
    });

    await t.test("paused settings accept valid preferences and reject all activation/unknown keys", async () => {
      await asRole("authenticated", OWNER);
      const updated = await settings({ timezone: "UTC", timezoneConfirmed: true,
        creation: { weekday: 2, localTime: "09:30", batchConcepts: 8 },
        publishing: { monthlyNetworkPostCap: 16, instagram: { weekdays: [1,3], localTime: "12:00" } } }, 1);
      assert.equal(updated.version, 2);
      assert.equal(updated.provider, "disabled");
      assert.equal(updated.creation_paused, true);
      assert.equal(updated.publishing_paused, true);
      assert.equal(updated.settings.timezoneConfirmed, true);
      assert.equal(updated.settings.creation.paused, true);
      assert.equal(updated.settings.publishing.paused, true);
      const bad = [
        { provider: "metricool_mcp" }, { unknown: true }, { creation: { paused: false } },
        { publishing: { paused: false } }, { creation: { generateNow: true } },
        { publishing: { instagram: { publishNow: true } } }, { timezone: "Mars/Olympus" },
        { timezoneConfirmed: "yes" }, { creation: { weekday: 7 } }, { creation: { localTime: "25:30" } },
        { publishing: { monthlyNetworkPostCap: 21 } }, { publishing: { maxLateMinutes: 1441 } },
        { publishing: { threads: { weekdays: [1,1] } } }, { publishing: { instagram: { weekdays: ["1"] } } },
        { creation: null }, { publishing: [] }, { creation: { batchConcepts: 9 } },
      ];
      for (const value of bad) await rejects(() => settings(value,2), "22023", json(value));
      assert.equal(await scalar("select version from public.social_settings"), 2);
      await rejects(() => settings({},1), "40001");
      await rejects(() => settings({},0), "40001");
    });

    await t.test("allowlist revocation immediately hides owned data and blocks write RPCs", async () => {
      await asRole("authenticated", REVOKED_OWNER);
      const draft = await create();
      await settings();
      await asRole("postgres");
      await db.query("delete from test_private.owner_allowlist where user_id=$1", [REVOKED_OWNER]);
      await asRole("authenticated", REVOKED_OWNER);
      assert.equal(await scalar("select public.is_admin()"), false);
      for (const table of TABLES) assert.deepEqual(await rows(`select * from public.${table}`), []);
      await rejects(() => create(), "42501");
      await rejects(() => revise(draft), "42501");
      await rejects(() => approve([item(draft)]), "42501");
      await rejects(() => settings({},1), "42501");
    });

    await t.test("no RPC created a job, schedule, receipt, provider connection, or cron", async () => {
      await asRole("postgres");
      const jobs = await rows("select * from public.social_dispatch_jobs");
      assert.equal(jobs.length,2); // Exactly the deliberate positive-RLS fixtures.
      for (const job of jobs) {
        assert.match(job.idempotency_key,/^TEST-ONLY-BLOCKED:/);
        assert.equal(job.state,"blocked");
        assert.equal(job.authorization_scope,"none");
        assert.equal(job.provider,"disabled");
        assert.equal(job.publish_at,null);
        assert.equal(job.receipt,null);
      }
      assert.equal(await scalar("select count(*)::int from public.social_accounts where provider <> 'disabled' or connection_status <> 'unverified'"),0);
      assert.equal(await scalar("select count(*)::int from pg_extension where extname in ('pg_cron','pg_net','http')"),0);
      await rejects(() => db.exec("update public.social_dispatch_jobs set state='scheduled'"), "23514");
      await rejects(() => db.exec("update public.social_dispatch_jobs set publish_at=now()"), "23514");
      await rejects(() => db.exec("update public.social_dispatch_jobs set receipt='{}'::jsonb"), "23514");
      await rejects(() => db.exec("update public.social_settings set publishing_paused=false"), "23514");
    });
  } finally {
    await db.close();
  }
});
