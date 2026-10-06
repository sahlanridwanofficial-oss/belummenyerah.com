-- Reviewed structural template. Production migration 20261006184949 applied
-- transactionally with a separately verified owner binding on 2026-10-06.
-- No owner identity is embedded here. Do not re-run against the migrated database.
-- Live policy snapshot: PostgreSQL 17.6, 2026-10-06.
-- Apply only after owner identity and action-time security approval are verified.
-- Empty membership intentionally denies everyone until a separately verified seed.
begin;

-- Refuse any drift in the complete reviewed policy inventory before changing it.
-- Whitespace in PostgreSQL's displayed expressions is normalized; predicates,
-- roles, commands, permissiveness, table and policy names must match exactly.
do $$
begin
  if exists (
    with expected(tablename, policyname, roles, cmd, qual, with_check) as (values
      ('kiriman', 'redaksi mengelola kiriman', array['authenticated']::text[], 'ALL', 'true', 'true'),
      ('kursus', 'redaksi mengelola kursus', array['authenticated']::text[], 'ALL', 'true', 'true'),
      ('modul', 'redaksi mengelola modul', array['authenticated']::text[], 'ALL', 'true', 'true'),
      ('pelajaran', 'redaksi mengelola pelajaran', array['authenticated']::text[], 'ALL', 'true', 'true'),
      ('pelanggan', 'redaksi mengelola pelanggan', array['authenticated']::text[], 'ALL', 'true', 'true'),
      ('pendaftaran', 'redaksi mengelola pendaftaran', array['authenticated']::text[], 'ALL', 'true', 'true'),
      ('tulisan', 'redaksi membaca semua tulisan', array['authenticated']::text[], 'SELECT', 'true', null),
      ('tulisan', 'redaksi menambah tulisan', array['authenticated']::text[], 'INSERT', null, 'true'),
      ('tulisan', 'redaksi menghapus tulisan', array['authenticated']::text[], 'DELETE', 'true', null),
      ('tulisan', 'redaksi mengubah tulisan', array['authenticated']::text[], 'UPDATE', 'true', 'true'),
      ('tulisan', 'tulisan terbit terbuka untuk umum', array['anon','authenticated']::text[], 'SELECT', '(status=''terbit''::status_tulisan)', null),
      ('kursus', 'kursus terbit terbuka untuk umum', array['anon','authenticated']::text[], 'SELECT', '(status=''terbit''::status_tulisan)', null),
      ('modul', 'modul ikut status kursusnya', array['anon','authenticated']::text[], 'SELECT', '(EXISTS(SELECT1FROMkursuskWHERE((k.id=modul.kursus_id)AND(k.status=''terbit''::status_tulisan))))', null),
      ('pelajaran', 'pelajaran ikut status kursusnya', array['anon','authenticated']::text[], 'SELECT', '(EXISTS(SELECT1FROMkursuskWHERE((k.id=pelajaran.kursus_id)AND(k.status=''terbit''::status_tulisan))))', null)
    ), actual as (
      select tablename::text, policyname::text, roles::text[], cmd,
        regexp_replace(qual, '\s', '', 'g') as qual,
        regexp_replace(with_check, '\s', '', 'g') as with_check
      from pg_policies
      where schemaname = 'public'
        and tablename in ('tulisan', 'kiriman', 'kursus', 'modul', 'pelajaran', 'pelanggan', 'pendaftaran')
        and permissive = 'PERMISSIVE'
    )
    (select * from actual except select * from expected)
    union all
    (select * from expected except select * from actual)
  ) or exists (
    select 1 from pg_policies where schemaname = 'public'
      and tablename in ('tulisan', 'kiriman', 'kursus', 'modul', 'pelajaran', 'pelanggan', 'pendaftaran')
      and permissive <> 'PERMISSIVE'
  ) then
    raise exception 'Policy inventory changed; re-audit before applying owner-only access';
  end if;
end;
$$;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;
revoke all on table private.admin_users from public, anon, authenticated;

-- The definer is required to inspect the private allowlist without granting clients
-- access to that table. Identity comes only from the caller's verified JWT context.
create function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (select 1 from private.admin_users a where a.user_id = auth.uid());
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- Public RPC returns only the caller's own membership boolean. It is NOT a definer.
create function public.is_admin()
returns boolean
language sql stable security invoker
set search_path = ''
as $$ select private.is_admin(); $$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- Existing public-course SELECT policies and subscription RPCs are untouched.
-- Replace only the identified permissive editor policies from the audited snapshot.
drop policy "redaksi membaca semua tulisan" on public.tulisan;
drop policy "redaksi menambah tulisan" on public.tulisan;
drop policy "redaksi menghapus tulisan" on public.tulisan;
drop policy "redaksi mengubah tulisan" on public.tulisan;
drop policy "tulisan terbit terbuka untuk umum" on public.tulisan;
create policy "pemilik mengelola tulisan" on public.tulisan
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

alter policy "redaksi mengelola kiriman" on public.kiriman
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "redaksi mengelola kursus" on public.kursus
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "redaksi mengelola modul" on public.modul
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "redaksi mengelola pelajaran" on public.pelajaran
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "redaksi mengelola pelanggan" on public.pelanggan
  using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy "redaksi mengelola pendaftaran" on public.pendaftaran
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- RLS does not cover TRUNCATE or REFERENCES. Remove inherited client grants,
-- then retain only CRUD for authenticated clients and published-course reads.
revoke all on table public.tulisan, public.kiriman, public.kursus, public.modul,
  public.pelajaran, public.pelanggan, public.pendaftaran from public, anon, authenticated;
grant select, insert, update, delete on table public.tulisan, public.kiriman,
  public.kursus, public.modul, public.pelajaran, public.pelanggan, public.pendaftaran
  to authenticated;
grant select on table public.kursus, public.modul, public.pelajaran to anon;

alter table public.tulisan enable row level security;
alter table public.kiriman enable row level security;
alter table public.kursus enable row level security;
alter table public.modul enable row level security;
alter table public.pelajaran enable row level security;
alter table public.pelanggan enable row level security;
alter table public.pendaftaran enable row level security;

commit;
