-- Applied to Belum Menyerah via migration 20261006185903 on 2026-10-06.
-- Prerequisite: the separately reviewed public.is_admin() -> boolean contract.
-- All mutations are explicit content-authoring/review RPCs, never dispatch.
-- Replay in development only with the verified owner guard present.
begin;

do $$
begin
  if pg_catalog.to_regprocedure('public.is_admin()') is null then
    raise exception 'Apply the reviewed private-owner admin guard first';
  end if;
end;
$$;

create schema social_private;
revoke all on schema social_private from public, anon, authenticated, service_role;
-- Schema usage is needed by invoker wrappers; do NOT expose this schema to PostgREST.
grant usage on schema social_private to authenticated;

create table public.social_settings (
  owner_user_id uuid primary key references auth.users(id) on delete restrict,
  version bigint not null default 1 check (version between 1 and 9007199254740991),
  provider text not null default 'disabled' check (provider = 'disabled'),
  creation_paused boolean not null default true check (creation_paused),
  publishing_paused boolean not null default true check (publishing_paused),
  settings jsonb not null check (
    jsonb_typeof(settings) = 'object'
    and ((settings #> '{creation,paused}') = 'true'::jsonb) is true
    and ((settings #> '{publishing,paused}') = 'true'::jsonb) is true
  ),
  updated_at timestamptz not null default now()
);

-- Metadata placeholders only. No writer RPC, provider IDs, tokens, secrets, or OAuth.
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  platform text not null check (platform in ('instagram', 'threads')),
  display_handle text not null check (length(display_handle) between 1 and 100),
  provider text not null default 'disabled' check (provider = 'disabled'),
  connection_status text not null default 'unverified' check (connection_status = 'unverified'),
  created_at timestamptz not null default now(),
  unique (owner_user_id, id, platform)
);

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  platform text not null check (platform in ('instagram', 'threads')),
  account_id uuid,
  current_revision integer not null default 1 check (current_revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, id),
  foreign key (owner_user_id, account_id, platform)
    references public.social_accounts(owner_user_id, id, platform) on delete restrict
);

-- Every saved version is immutable, even before approval. Editing appends a version.
create table public.social_post_revisions (
  post_id uuid not null,
  revision integer not null check (revision > 0),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (length(btrim(title)) >= 1 and length(title) <= 160),
  text text not null check (length(btrim(text)) between 1 and 2200),
  slides jsonb not null default '[]'::jsonb check (jsonb_typeof(slides) = 'array'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (post_id, revision),
  unique (owner_user_id, post_id, revision),
  unique (owner_user_id, post_id, revision, content_sha256),
  foreign key (owner_user_id, post_id)
    references public.social_posts(owner_user_id, id) on delete restrict
);

alter table public.social_posts add constraint social_posts_current_revision_fk
  foreign key (owner_user_id, id, current_revision)
  references public.social_post_revisions(owner_user_id, post_id, revision)
  deferrable initially deferred;

create table public.social_content_approvals (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  post_id uuid not null,
  revision integer not null,
  content_sha256 text not null,
  target_platform text not null check (target_platform in ('instagram', 'threads')),
  target_account_id uuid,
  scope text not null default 'content_only' check (scope = 'content_only'),
  approved_at timestamptz not null default now(),
  unique (owner_user_id, post_id, revision),
  unique (owner_user_id, id, post_id, revision, content_sha256),
  foreign key (owner_user_id, post_id, revision, content_sha256)
    references public.social_post_revisions(owner_user_id, post_id, revision, content_sha256)
    on delete restrict,
  foreign key (owner_user_id, target_account_id, target_platform)
    references public.social_accounts(owner_user_id, id, platform) on delete restrict
);

-- Future receipt/dispatch envelope only. No inserts, schedules, worker, or claim RPC.
-- A later, separately reviewed migration must add actual publish authorization.
create table public.social_dispatch_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  approval_id uuid not null,
  post_id uuid not null,
  revision integer not null,
  content_sha256 text not null,
  idempotency_key text not null check (length(idempotency_key) between 1 and 200),
  provider text not null default 'disabled' check (provider = 'disabled'),
  state text not null default 'blocked' check (state = 'blocked'),
  authorization_scope text not null default 'none' check (authorization_scope = 'none'),
  publish_at timestamptz check (publish_at is null),
  schedule_timezone text check (schedule_timezone is null),
  receipt jsonb check (receipt is null),
  created_at timestamptz not null default now(),
  unique (owner_user_id, idempotency_key),
  foreign key (owner_user_id, approval_id, post_id, revision, content_sha256)
    references public.social_content_approvals(owner_user_id, id, post_id, revision, content_sha256)
    on delete restrict
);

create index social_accounts_owner_created_idx on public.social_accounts(owner_user_id, created_at desc);
create index social_posts_owner_updated_idx on public.social_posts(owner_user_id, updated_at desc);
create index social_posts_account_idx on public.social_posts(owner_user_id, account_id, platform);
create index social_approvals_account_idx on public.social_content_approvals(owner_user_id, target_account_id, target_platform);
create index social_jobs_owner_created_idx on public.social_dispatch_jobs(owner_user_id, created_at desc);
create index social_jobs_approval_idx on public.social_dispatch_jobs(owner_user_id, approval_id, post_id, revision, content_sha256);

-- Explicitly remove inherited Supabase grants. Only owner+admin SELECT is exposed.
-- No INSERT/UPDATE/DELETE policies: those operations must pass a transactional RPC.
do $$
declare t text;
begin
  foreach t in array array['social_settings','social_accounts','social_posts',
    'social_post_revisions','social_content_approvals','social_dispatch_jobs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('create policy owner_admin_read on public.%I for select to authenticated using ((select auth.uid()) = owner_user_id and (select public.is_admin()) is true)', t);
  end loop;
end;
$$;

create function social_private.require_owner() returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_owner uuid := auth.uid();
begin
  if v_owner is null or public.is_admin() is distinct from true then
    raise exception using errcode = '42501', message = 'Owner admin access required';
  end if;
  return v_owner;
end;
$$;

create function social_private.immutable_row() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode = '55000', message = 'Social audit rows are immutable; create a new revision';
end;
$$;
create trigger social_revision_immutable before update or delete on public.social_post_revisions
  for each row execute function social_private.immutable_row();
create trigger social_approval_immutable before update or delete on public.social_content_approvals
  for each row execute function social_private.immutable_row();
create trigger social_account_immutable before update or delete on public.social_accounts
  for each row execute function social_private.immutable_row();

create function social_private.guard_post_identity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.owner_user_id is distinct from old.owner_user_id
    or new.platform is distinct from old.platform or new.account_id is distinct from old.account_id
    or new.created_at is distinct from old.created_at
    or new.current_revision <> old.current_revision + 1 then
    raise exception using errcode = '55000', message = 'Post identity/target is immutable; create a new post';
  end if;
  return new;
end;
$$;
create trigger social_post_identity before update on public.social_posts
  for each row execute function social_private.guard_post_identity();

create function social_private.validate_content(
  p_platform text, p_title text, p_text text, p_slides jsonb, p_sources jsonb
) returns void language plpgsql security invoker set search_path = '' as $$
declare v_item jsonb;
begin
  if p_platform is null or p_platform not in ('instagram', 'threads')
    or p_title is null or (length(btrim(p_title)) < 1 or length(p_title) > 160)
    or p_text is null or length(btrim(p_text)) < 1
    or length(p_text) > (case when p_platform = 'threads' then 500 else 2200 end)
    or jsonb_typeof(p_slides) is distinct from 'array'
    or jsonb_typeof(p_sources) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Invalid content payload';
  end if;
  if (p_platform = 'instagram' and jsonb_array_length(p_slides) not between 2 and 10)
    or (p_platform = 'threads' and jsonb_array_length(p_slides) <> 0)
    or jsonb_array_length(p_sources) not between 1 and 10 then
    raise exception using errcode = '22023', message = 'Invalid slides or sources';
  end if;
  for v_item in select value from jsonb_array_elements(p_slides) loop
    if jsonb_typeof(v_item) <> 'string' or (length(btrim(v_item #>> '{}')) < 1 or length(v_item #>> '{}') > 1000) then
      raise exception using errcode = '22023', message = 'Each slide must be nonempty text';
    end if;
  end loop;
  for v_item in select value from jsonb_array_elements(p_sources) loop
    if jsonb_typeof(v_item) <> 'string' or (length(btrim(v_item #>> '{}')) < 1 or length(v_item #>> '{}') > 1000) then
      raise exception using errcode = '22023', message = 'Each source must be nonempty text';
    end if;
  end loop;
end;
$$;

create function social_private.revision_hash(
  p_post_id uuid, p_revision integer, p_platform text, p_account_id uuid,
  p_title text, p_text text, p_slides jsonb, p_sources jsonb
) returns text language sql immutable security invoker set search_path = '' as $$
  select encode(sha256(convert_to(jsonb_build_object(
    'post_id', p_post_id, 'revision', p_revision, 'platform', p_platform,
    'account_id', p_account_id, 'title', p_title, 'text', p_text,
    'slides', p_slides, 'sources', p_sources
  )::text, 'UTF8')), 'hex');
$$;

create function social_private.create_draft(
  p_platform text, p_account_id uuid, p_title text, p_text text, p_slides jsonb, p_sources jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := social_private.require_owner();
  v_post_id uuid := gen_random_uuid();
  v_revision public.social_post_revisions;
begin
  perform social_private.validate_content(p_platform,p_title,p_text,p_slides,p_sources);
  if p_account_id is not null and not exists (
    select 1 from public.social_accounts a
    where a.id = p_account_id and a.owner_user_id = v_owner and a.platform = p_platform
  ) then
    raise exception using errcode = '42501', message = 'Account metadata unavailable';
  end if;
  insert into public.social_posts(id,owner_user_id,platform,account_id)
    values (v_post_id,v_owner,p_platform,p_account_id);
  insert into public.social_post_revisions(post_id,revision,owner_user_id,title,text,slides,sources,content_sha256)
    values (v_post_id,1,v_owner,p_title,p_text,p_slides,p_sources,
      social_private.revision_hash(v_post_id,1,p_platform,p_account_id,p_title,p_text,p_slides,p_sources))
    returning * into v_revision;
  return to_jsonb(v_revision);
end;
$$;

create function social_private.revise_draft(
  p_post_id uuid, p_expected_revision integer, p_title text, p_text text, p_slides jsonb, p_sources jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := social_private.require_owner();
  v_post public.social_posts;
  v_revision public.social_post_revisions;
  v_next integer;
begin
  select * into v_post from public.social_posts
    where id = p_post_id and owner_user_id = v_owner for update;
  if not found then
    raise exception using errcode = '42501', message = 'Draft unavailable';
  end if;
  if p_expected_revision is null or v_post.current_revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Revision changed; refresh before saving';
  end if;
  perform social_private.validate_content(v_post.platform,p_title,p_text,p_slides,p_sources);
  v_next := v_post.current_revision + 1;
  insert into public.social_post_revisions(post_id,revision,owner_user_id,title,text,slides,sources,content_sha256)
    values (p_post_id,v_next,v_owner,p_title,p_text,p_slides,p_sources,
      social_private.revision_hash(p_post_id,v_next,v_post.platform,v_post.account_id,p_title,p_text,p_slides,p_sources))
    returning * into v_revision;
  update public.social_posts set current_revision = v_next, updated_at = now()
    where id = p_post_id and owner_user_id = v_owner;
  -- Prior approvals remain as history; the new current revision has none.
  return to_jsonb(v_revision);
end;
$$;

create function social_private.approve_batch(p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := social_private.require_owner();
  v_item jsonb;
  v_post public.social_posts;
  v_revision public.social_post_revisions;
  v_approval public.social_content_approvals;
  v_output jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Approval items must be an array';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception using errcode = '22023', message = 'Approve between 1 and 50 items';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or (select count(*) from jsonb_object_keys(v_item)) <> 3
      or jsonb_typeof(v_item -> 'post_id') is distinct from 'string'
      or jsonb_typeof(v_item -> 'revision') is distinct from 'number'
      or coalesce(v_item ->> 'revision','') !~ '^[1-9][0-9]*$'
      or coalesce(v_item ->> 'content_sha256','') !~ '^[0-9a-f]{64}$' then
      raise exception using errcode = '22023', message = 'Each approval needs post_id, revision, content_sha256';
    end if;
  end loop;
  if (select count(distinct (value ->> 'post_id')::uuid) from jsonb_array_elements(p_items))
    <> jsonb_array_length(p_items) then
    raise exception using errcode = '22023', message = 'Duplicate post in approval batch';
  end if;
  -- Global UUID order prevents deadlocks between overlapping batches.
  for v_item in select value from jsonb_array_elements(p_items) order by (value ->> 'post_id')::uuid loop
    select * into v_post from public.social_posts
      where id = (v_item ->> 'post_id')::uuid and owner_user_id = v_owner for update;
    if not found then
      raise exception using errcode = '42501', message = 'Draft unavailable';
    end if;
    if v_post.current_revision <> (v_item ->> 'revision')::integer then
      raise exception using errcode = '40001', message = 'Revision changed; review again';
    end if;
    select * into v_revision from public.social_post_revisions
      where post_id = v_post.id and revision = v_post.current_revision and owner_user_id = v_owner;
    if not found or v_revision.content_sha256 is distinct from (v_item ->> 'content_sha256') then
      raise exception using errcode = '40001', message = 'Content hash changed; review again';
    end if;
    insert into public.social_content_approvals(owner_user_id,post_id,revision,content_sha256,target_platform,target_account_id)
      values (v_owner,v_post.id,v_revision.revision,v_revision.content_sha256,v_post.platform,v_post.account_id)
      on conflict (owner_user_id,post_id,revision) do nothing;
    select * into v_approval from public.social_content_approvals
      where owner_user_id = v_owner and post_id = v_post.id and revision = v_revision.revision;
    v_output := v_output || jsonb_build_array(to_jsonb(v_approval));
  end loop;
  -- One exception rolls back the entire batch; repeat exact requests are idempotent.
  -- This never inserts a job and never grants publish/schedule/media authorization.
  return v_output;
end;
$$;

create function social_private.normalize_settings(p_settings jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_settings jsonb := '{"timezone":"Asia/Jakarta","timezoneConfirmed":false,"creation":{"paused":true,"cadence":"weekly","weekday":null,"localTime":null,"batchConcepts":2},"publishing":{"paused":true,"monthlyNetworkPostCap":16,"maxLateMinutes":60,"instagram":{"weekdays":[],"localTime":null},"threads":{"weekdays":[],"localTime":null}}}'::jsonb;
  v_creation jsonb;
  v_publishing jsonb;
  v_plan jsonb;
  v_platform text;
  v_value jsonb;
  v_time text;
begin
  if jsonb_typeof(p_settings) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'Settings must be an object';
  end if;
  if exists (select 1 from jsonb_object_keys(p_settings) k where k not in ('timezone','timezoneConfirmed','creation','publishing')) then
    raise exception using errcode = '22023', message = 'Unknown settings key';
  end if;
  if p_settings ? 'creation' and jsonb_typeof(p_settings -> 'creation') <> 'object'
    or p_settings ? 'publishing' and jsonb_typeof(p_settings -> 'publishing') <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid schedule settings';
  end if;
  v_creation := (v_settings -> 'creation') || coalesce(p_settings -> 'creation','{}'::jsonb);
  v_publishing := (v_settings -> 'publishing') || coalesce(p_settings -> 'publishing','{}'::jsonb);
  if exists (select 1 from jsonb_object_keys(v_creation) k where k not in ('paused','cadence','weekday','localTime','batchConcepts'))
    or exists (select 1 from jsonb_object_keys(v_publishing) k where k not in ('paused','monthlyNetworkPostCap','maxLateMinutes','instagram','threads'))
    or (v_creation -> 'paused') is distinct from 'true'::jsonb
    or (v_publishing -> 'paused') is distinct from 'true'::jsonb
    or (v_creation ->> 'cadence') is distinct from 'weekly' then
    raise exception using errcode = '22023', message = 'Unsupported settings; creation and publishing must stay paused';
  end if;
  if coalesce(v_creation ->> 'batchConcepts','') !~ '^[1-8]$'
    or jsonb_typeof(v_creation -> 'batchConcepts') <> 'number'
    or coalesce(v_publishing ->> 'monthlyNetworkPostCap','') !~ '^([1-9]|1[0-9]|20)$'
    or jsonb_typeof(v_publishing -> 'monthlyNetworkPostCap') <> 'number'
    or coalesce(v_publishing ->> 'maxLateMinutes','') !~ '^[0-9]{1,4}$'
    or jsonb_typeof(v_publishing -> 'maxLateMinutes') <> 'number' then
    raise exception using errcode = '22023', message = 'Invalid batch or pilot limits';
  end if;
  if (v_publishing ->> 'maxLateMinutes')::integer > 1440 then
    raise exception using errcode = '22023', message = 'Lateness limit exceeds one day';
  end if;
  v_value := v_creation -> 'weekday';
  if v_value <> 'null'::jsonb and (jsonb_typeof(v_value) <> 'number' or (v_value #>> '{}') !~ '^[0-6]$') then
    raise exception using errcode = '22023', message = 'Invalid creation weekday';
  end if;
  v_time := v_creation ->> 'localTime';
  if v_time is not null and v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception using errcode = '22023', message = 'Invalid creation time';
  end if;
  foreach v_platform in array array['instagram','threads'] loop
    if jsonb_typeof(v_publishing -> v_platform) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'Invalid platform schedule';
    end if;
    v_plan := (v_settings #> array['publishing',v_platform]) || (v_publishing -> v_platform);
    if exists (select 1 from jsonb_object_keys(v_plan) k where k not in ('weekdays','localTime'))
      or jsonb_typeof(v_plan -> 'weekdays') is distinct from 'array' then
      raise exception using errcode = '22023', message = 'Invalid platform settings';
    end if;
    if jsonb_array_length(v_plan -> 'weekdays') > 7
      or (select count(distinct value) from jsonb_array_elements(v_plan -> 'weekdays')) <> jsonb_array_length(v_plan -> 'weekdays') then
      raise exception using errcode = '22023', message = 'Duplicate or excessive weekdays';
    end if;
    for v_value in select value from jsonb_array_elements(v_plan -> 'weekdays') loop
      if jsonb_typeof(v_value) <> 'number' or (v_value #>> '{}') !~ '^[0-6]$' then
        raise exception using errcode = '22023', message = 'Invalid publication weekday';
      end if;
    end loop;
    v_time := v_plan ->> 'localTime';
    if v_time is not null and v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      raise exception using errcode = '22023', message = 'Invalid publication time';
    end if;
    v_publishing := jsonb_set(v_publishing,array[v_platform],v_plan);
  end loop;
  v_settings := v_settings || p_settings;
  if jsonb_typeof(v_settings -> 'timezoneConfirmed') is distinct from 'boolean' then
    raise exception using errcode = '22023', message = 'Explicit timezone confirmation must be boolean';
  end if;
  if jsonb_typeof(v_settings -> 'timezone') is distinct from 'string'
    or not exists (select 1 from pg_catalog.pg_timezone_names where name = v_settings ->> 'timezone') then
    raise exception using errcode = '22023', message = 'Unknown timezone';
  end if;
  return jsonb_set(jsonb_set(v_settings,'{creation}',v_creation),'{publishing}',v_publishing);
end;
$$;

create function social_private.save_settings(p_settings jsonb, p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := social_private.require_owner();
  v_settings jsonb := social_private.normalize_settings(p_settings);
  v_row public.social_settings;
begin
  if p_expected_version is null or p_expected_version < 0 then
    raise exception using errcode = '22023', message = 'Expected settings version required';
  end if;
  if p_expected_version = 0 then
    insert into public.social_settings(owner_user_id,settings) values (v_owner,v_settings)
      on conflict (owner_user_id) do nothing returning * into v_row;
  else
    update public.social_settings set settings = v_settings, version = version + 1, updated_at = now()
      where owner_user_id = v_owner and version = p_expected_version returning * into v_row;
  end if;
  if v_row.owner_user_id is null then
    raise exception using errcode = '40001', message = 'Settings changed; refresh before saving';
  end if;
  return to_jsonb(v_row);
end;
$$;

-- Public wrappers stay SECURITY INVOKER. Hardened privileged implementations are private.
create function public.social_create_draft(p_platform text,p_account_id uuid,p_title text,p_text text,p_slides jsonb,p_sources jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select social_private.create_draft(p_platform,p_account_id,p_title,p_text,p_slides,p_sources);
$$;
create function public.social_revise_draft(p_post_id uuid,p_expected_revision integer,p_title text,p_text text,p_slides jsonb,p_sources jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select social_private.revise_draft(p_post_id,p_expected_revision,p_title,p_text,p_slides,p_sources);
$$;
create function public.social_approve_batch(p_items jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select social_private.approve_batch(p_items);
$$;
create function public.social_save_settings(p_settings jsonb,p_expected_version bigint)
returns jsonb language sql security invoker set search_path = '' as $$
  select social_private.save_settings(p_settings,p_expected_version);
$$;

-- Remove default PUBLIC execution before granting only the four entrypoint pairs.
revoke all on all functions in schema social_private from public, anon, authenticated, service_role;
revoke all on function public.social_create_draft(text,uuid,text,text,jsonb,jsonb) from public, anon, authenticated, service_role;
revoke all on function public.social_revise_draft(uuid,integer,text,text,jsonb,jsonb) from public, anon, authenticated, service_role;
revoke all on function public.social_approve_batch(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.social_save_settings(jsonb,bigint) from public, anon, authenticated, service_role;
grant execute on function social_private.create_draft(text,uuid,text,text,jsonb,jsonb) to authenticated;
grant execute on function social_private.revise_draft(uuid,integer,text,text,jsonb,jsonb) to authenticated;
grant execute on function social_private.approve_batch(jsonb) to authenticated;
grant execute on function social_private.save_settings(jsonb,bigint) to authenticated;
grant execute on function public.social_create_draft(text,uuid,text,text,jsonb,jsonb) to authenticated;
grant execute on function public.social_revise_draft(uuid,integer,text,text,jsonb,jsonb) to authenticated;
grant execute on function public.social_approve_batch(jsonb) to authenticated;
grant execute on function public.social_save_settings(jsonb,bigint) to authenticated;

comment on table public.social_content_approvals is 'Content review only. Never publish authorization. Superseded after editing.';
comment on table public.social_dispatch_jobs is 'Reserved blocked envelope; no worker, schedule, or publish authorization exists.';
comment on schema social_private is 'Do not expose through Data API; hardened internal social-authoring implementations.';
commit;
