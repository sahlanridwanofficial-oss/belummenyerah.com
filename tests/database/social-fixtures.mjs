/** TEST ONLY: neither Supabase Auth nor the production owner guard is running. */
export const OWNER = "10000000-0000-4000-8000-000000000001";
export const OTHER_ADMIN = "20000000-0000-4000-8000-000000000002";
export const NON_ADMIN = "30000000-0000-4000-8000-000000000003";
export const REVOKED_OWNER = "40000000-0000-4000-8000-000000000004";

export const fixtureSql = `
create role anon nologin nobypassrls;
create role authenticated nologin nobypassrls;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
insert into auth.users(id) values ('${OWNER}'),('${OTHER_ADMIN}'),('${NON_ADMIN}'),('${REVOKED_OWNER}');
create function auth.uid() returns uuid language sql stable security invoker set search_path = '' as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
revoke all on schema auth from public;
grant usage on schema auth to anon, authenticated, service_role;
revoke all on function auth.uid() from public;
grant execute on function auth.uid() to anon, authenticated, service_role;
create schema test_private;
revoke all on schema test_private from public, anon, authenticated, service_role;
create table test_private.owner_allowlist (user_id uuid primary key references auth.users(id));
insert into test_private.owner_allowlist(user_id) values ('${OWNER}'),('${OTHER_ADMIN}'),('${REVOKED_OWNER}');
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from test_private.owner_allowlist where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to authenticated;
`;
