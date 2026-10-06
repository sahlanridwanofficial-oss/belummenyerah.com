/** Real isolated PostgreSQL via PGlite. Never connects to Supabase or uses live identities.
 * auth.uid() is a test claim stub: this verifies SQL/RLS, not Supabase JWT verification.
 * Target live PostgreSQL: 17.6. Test engine: PGlite PostgreSQL 18.3.
 * Run: PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node --test tests/database/owner-security.test.mjs
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {PGlite}=await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const OWNER='10000000-0000-4000-8000-000000000001',OTHER='20000000-0000-4000-8000-000000000002';
const PUB='30000000-0000-4000-8000-000000000003',DRAFT='40000000-0000-4000-8000-000000000004';
const MOD='50000000-0000-4000-8000-000000000005',SUB='60000000-0000-4000-8000-000000000006';
const tables=['tulisan','pelanggan','kiriman','kursus','modul','pelajaran','pendaftaran'];
const insert={
 tulisan:"insert into public.tulisan(slug,judul) values ('new-test','New')",
 pelanggan:"insert into public.pelanggan(email) values ('new@example.test')",
 kiriman:"insert into public.kiriman(judul) values ('New')",
 kursus:"insert into public.kursus(slug,judul) values ('new-test','New')",
 modul:`insert into public.modul(kursus_id,judul) values ('${PUB}','New')`,
 pelajaran:`insert into public.pelajaran(kursus_id,modul_id,slug,judul) values ('${PUB}','${MOD}','new-test','New')`,
 pendaftaran:`insert into public.pendaftaran(kursus_id,pelanggan_id) values ('${DRAFT}','${SUB}')`,
};
async function fixture(apply=true){
 const db=new PGlite();
 await db.exec(`create role anon nologin nobypassrls; create role authenticated nologin nobypassrls; create schema auth;
 create table auth.users(id uuid primary key); insert into auth.users values ('${OWNER}'),('${OTHER}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 // pgcrypto extension is not bundled. gen_random_uuid() is built into PostgreSQL;
 // all schema, policy, trigger and RPC definitions below are the repository SQL.
 for(const file of ['0001_awal.sql','0002_kursus.sql']) await db.exec(fs.readFileSync(path.join(repo,'supabase/migrations',file),'utf8').replace('create extension if not exists pgcrypto;',''));
 await db.exec(`grant all on all tables in schema public to anon,authenticated;
 insert into public.tulisan(slug,judul,status) values('legacy','Legacy','terbit'),('draft','Draft','draf');
 insert into public.kursus(id,slug,judul,status) values('${PUB}','public-course','Public','terbit'),('${DRAFT}','draft-course','Draft','draf');
 insert into public.modul(id,kursus_id,judul) values('${MOD}','${PUB}','Public module'),('70000000-0000-4000-8000-000000000007','${DRAFT}','Draft module');
 insert into public.pelajaran(kursus_id,modul_id,slug,judul) values('${PUB}','${MOD}','lesson','Public lesson'),('${DRAFT}','70000000-0000-4000-8000-000000000007','lesson','Draft lesson');
 insert into public.pelanggan(id,email) values('${SUB}','private@example.test');
 insert into public.kiriman(judul) values('Private send');
 insert into public.pendaftaran(kursus_id,pelanggan_id) values('${PUB}','${SUB}');`);
 if(apply) await db.exec(fs.readFileSync(path.join(repo,'supabase/proposals/owner-only-access.sql'),'utf8'));
 return db;
}
async function asRole(db,role,id,fn){
 await db.exec('begin');
 try{
  await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id||'']);
  await db.exec(`set local role ${role}`);
  return await fn();
 }finally{await db.exec('rollback');}
}
const count=async(db,table)=>(await db.query(`select count(*)::int n from public.${table}`)).rows[0].n;

test('exact owner-only SQL starts empty and safely restricts anon/non-owner while preserving public courses/RPCs',async()=>{
 const db=await fixture();
 try{
  assert.equal((await db.query('select count(*)::int n from private.admin_users')).rows[0].n,0);
  await asRole(db,'authenticated',OWNER,async()=>assert.equal((await db.query('select public.is_admin() allowed')).rows[0].allowed,false));
  for(const role of ['anon','authenticated']){
   await asRole(db,role,OTHER,async()=>{
    for(const table of ['kursus','modul','pelajaran'])assert.equal(await count(db,table),1,role+' public '+table);
   });
   for(const table of ['tulisan','pelanggan','kiriman','pendaftaran'])await asRole(db,role,OTHER,async()=>{
    if(role==='anon')await assert.rejects(db.query(`select * from public.${table}`),/permission denied/);
    else assert.equal(await count(db,table),0,table);
   });
   for(const table of tables){
    await asRole(db,role,OTHER,async()=>await assert.rejects(db.query(insert[table]),/permission denied|row-level security/));
    for(const operation of [`update public.${table} set id=id returning id`,`delete from public.${table} returning id`])await asRole(db,role,OTHER,async()=>{
     if(role==='anon')await assert.rejects(db.query(operation),/permission denied/);
     else assert.equal((await db.query(operation)).rows.length,0,operation);
    });
   }
   await asRole(db,role,OTHER,async()=>await assert.rejects(db.query('select * from private.admin_users'),/permission denied/));
   await asRole(db,role,OTHER,async()=>await assert.rejects(db.query(`insert into private.admin_users(user_id) values('${OTHER}')`),/permission denied/));
   await asRole(db,role,OTHER,async()=>await assert.rejects(db.query('truncate public.pelanggan'),/permission denied/));
   // Subscription RPCs remain usable without exposing their backing tables.
   await asRole(db,role,OTHER,async()=>{
    await db.query("select public.daftar_pelanggan('new-subscriber@example.test','test')");
    await db.query("select public.daftar_kursus('public-course','course-subscriber@example.test')");
   });
  }
  await asRole(db,'anon','',async()=>await assert.rejects(db.query('select public.is_admin()'),/permission denied/));
 }finally{await db.close();}
});

test('fake verified owner alone gains CRUD; revocation and nested SECURITY DEFINER preserve caller identity',async()=>{
 const db=await fixture();
 try{
  await db.exec(`insert into private.admin_users(user_id) values('${OWNER}');`);
  for(const table of tables)await asRole(db,'authenticated',OWNER,async()=>{
   assert.ok(await count(db,table)>0,table);
   const id=(await db.query(insert[table]+' returning id')).rows[0].id;
   assert.equal((await db.query(`update public.${table} set id=id where id=$1 returning id`,[id])).rows.length,1);
   assert.equal((await db.query(`delete from public.${table} where id=$1 returning id`,[id])).rows.length,1);
  });
  await asRole(db,'authenticated',OWNER,async()=>assert.equal((await db.query('select public.is_admin() allowed')).rows[0].allowed,true));
  await asRole(db,'authenticated',OWNER,async()=>await assert.rejects(db.query('select * from private.admin_users'),/permission denied/));
  await db.exec(`create function private.test_nested_admin() returns boolean language sql security definer set search_path='' as $$select public.is_admin()$$; revoke all on function private.test_nested_admin() from public; grant execute on function private.test_nested_admin() to authenticated;`);
  for(const [id,expected] of [[OWNER,true],[OTHER,false],['',false]])await asRole(db,'authenticated',id,async()=>assert.equal((await db.query('select private.test_nested_admin() allowed')).rows[0].allowed,expected));
  const functions=(await db.query("select n.nspname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on p.pronamespace=n.oid where p.proname='is_admin' order by n.nspname")).rows;
  assert.deepEqual(functions.map(f=>[f.nspname,f.prosecdef]),[['private',true],['public',false]]);
  assert.ok(functions.every(f=>f.proconfig.some(c=>/^search_path=/.test(c))));
  await db.exec(`delete from private.admin_users where user_id='${OWNER}'`);
  await asRole(db,'authenticated',OWNER,async()=>assert.equal((await db.query('select public.is_admin() allowed')).rows[0].allowed,false));
 }finally{await db.close();}
});

for (const change of [
 'alter policy "kursus terbit terbuka untuk umum" on public.kursus using (true)',
 'alter policy "modul ikut status kursusnya" on public.modul to anon',
 'alter policy "redaksi mengelola pelanggan" on public.pelanggan with check (false)',
]) test(`same-count policy drift aborts before owner security writes: ${change}`,async()=>{
 const db=await fixture(false);
 try {
  await db.exec(change);
  await assert.rejects(db.exec(fs.readFileSync(path.join(repo,'supabase/proposals/owner-only-access.sql'),'utf8')),/Policy inventory changed/);
  await db.exec('rollback');
  assert.equal((await db.query("select exists(select 1 from pg_namespace where nspname='private') as present")).rows[0].present,false);
 } finally {await db.close();}
});
