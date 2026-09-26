-- belummenyerah — skema awal
-- Tiga tabel: tulisan, pelanggan, kiriman.
-- Pembaca anonim hanya boleh membaca tulisan berstatus 'terbit'.
-- Redaksi (siapa pun yang login lewat Supabase Auth) boleh semuanya.

create extension if not exists pgcrypto;

create type public.jalur as enum ('bertahan', 'bangun', 'uang-pribadi', 'cerita');
create type public.format_tulisan as enum ('catatan', 'satu-halaman', 'panduan', 'wawancara');
create type public.status_tulisan as enum ('draf', 'terbit');

create table public.tulisan (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  judul        text not null,
  deck         text not null default '',
  isi          text not null default '',
  jalur        public.jalur not null default 'bertahan',
  format       public.format_tulisan not null default 'catatan',
  nomor        integer,
  penulis      text not null default 'Redaksi',
  status       public.status_tulisan not null default 'draf',
  menit_baca   integer not null default 1,
  terbit_pada  timestamptz,
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

create index tulisan_terbit_idx on public.tulisan (status, terbit_pada desc nulls last);
create index tulisan_jalur_idx on public.tulisan (jalur, terbit_pada desc nulls last);

create table public.pelanggan (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  status        text not null default 'aktif' check (status in ('aktif', 'berhenti')),
  sumber        text,
  token         uuid not null default gen_random_uuid(),
  dibuat_pada   timestamptz not null default now(),
  berhenti_pada timestamptz
);

create unique index pelanggan_email_idx on public.pelanggan (lower(email));
create unique index pelanggan_token_idx on public.pelanggan (token);

create table public.kiriman (
  id              uuid primary key default gen_random_uuid(),
  tulisan_id      uuid references public.tulisan (id) on delete set null,
  judul           text not null default '',
  jumlah_penerima integer not null default 0,
  jumlah_gagal    integer not null default 0,
  dikirim_pada    timestamptz not null default now()
);

create index kiriman_waktu_idx on public.kiriman (dikirim_pada desc);

-- diubah_pada ikut bergerak sendiri
create or replace function public.sentuh_diubah_pada()
returns trigger
language plpgsql
as $$
begin
  new.diubah_pada = now();
  return new;
end;
$$;

create trigger tulisan_sentuh_diubah_pada
  before update on public.tulisan
  for each row execute function public.sentuh_diubah_pada();

-- Keamanan baris
alter table public.tulisan  enable row level security;
alter table public.pelanggan enable row level security;
alter table public.kiriman   enable row level security;

create policy "tulisan terbit terbuka untuk umum"
  on public.tulisan for select to anon, authenticated
  using (status = 'terbit');

create policy "redaksi membaca semua tulisan"
  on public.tulisan for select to authenticated using (true);

create policy "redaksi menambah tulisan"
  on public.tulisan for insert to authenticated with check (true);

create policy "redaksi mengubah tulisan"
  on public.tulisan for update to authenticated using (true) with check (true);

create policy "redaksi menghapus tulisan"
  on public.tulisan for delete to authenticated using (true);

create policy "redaksi mengelola pelanggan"
  on public.pelanggan for all to authenticated using (true) with check (true);

create policy "redaksi mengelola kiriman"
  on public.kiriman for all to authenticated using (true) with check (true);

-- Pendaftaran dan berhenti langganan lewat fungsi, bukan lewat akses tabel.
-- Dengan begitu daftar pelanggan tidak pernah terbuka ke publik.

create or replace function public.daftar_pelanggan(p_email text, p_sumber text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bersih text := lower(trim(p_email));
begin
  if bersih is null or bersih !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Alamat email tidak sah';
  end if;

  insert into public.pelanggan (email, sumber)
  values (bersih, nullif(trim(coalesce(p_sumber, '')), ''))
  on conflict (lower(email)) do update
    set status = 'aktif',
        berhenti_pada = null;
end;
$$;

create or replace function public.berhenti_langganan(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  jumlah integer;
begin
  update public.pelanggan
     set status = 'berhenti',
         berhenti_pada = now()
   where token = p_token
     and status = 'aktif';
  get diagnostics jumlah = row_count;
  return jumlah > 0;
end;
$$;

revoke all on function public.daftar_pelanggan(text, text) from public;
revoke all on function public.berhenti_langganan(uuid) from public;
grant execute on function public.daftar_pelanggan(text, text) to anon, authenticated;
grant execute on function public.berhenti_langganan(uuid) to anon, authenticated;
