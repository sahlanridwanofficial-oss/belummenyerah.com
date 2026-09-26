-- belummenyerah — kursus
-- Kursus gratis, satu penerbit. Susunannya: kursus → modul → pelajaran.
-- Pelajaran boleh berisi teks, video, atau dua-duanya.
-- Pendaftaran memakai ulang tabel pelanggan, supaya peserta kursus dan
-- pembaca newsletter tidak terpecah jadi dua daftar.

create type public.tingkat as enum ('pemula', 'menengah', 'lanjut');

create table public.kursus (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  judul        text not null,
  deck         text not null default '',
  ringkasan    text not null default '',
  untuk_siapa  text not null default '',
  jalur        public.jalur not null default 'bertahan',
  tingkat      public.tingkat not null default 'pemula',
  status       public.status_tulisan not null default 'draf',
  penulis      text not null default 'Redaksi',
  urutan       integer not null default 0,
  terbit_pada  timestamptz,
  dibuat_pada  timestamptz not null default now(),
  diubah_pada  timestamptz not null default now()
);

create index kursus_terbit_idx on public.kursus (status, urutan, terbit_pada desc nulls last);

create table public.modul (
  id          uuid primary key default gen_random_uuid(),
  kursus_id   uuid not null references public.kursus (id) on delete cascade,
  judul       text not null,
  ringkas     text not null default '',
  urutan      integer not null default 0,
  dibuat_pada timestamptz not null default now()
);

create index modul_kursus_idx on public.modul (kursus_id, urutan);

create table public.pelajaran (
  id          uuid primary key default gen_random_uuid(),
  kursus_id   uuid not null references public.kursus (id) on delete cascade,
  modul_id    uuid not null references public.modul (id) on delete cascade,
  slug        text not null,
  judul       text not null,
  ringkas     text not null default '',
  isi         text not null default '',
  video_url   text,
  menit       integer not null default 0,
  urutan      integer not null default 0,
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now()
);

create unique index pelajaran_slug_idx on public.pelajaran (kursus_id, slug);
create index pelajaran_modul_idx on public.pelajaran (modul_id, urutan);

create table public.pendaftaran (
  id           uuid primary key default gen_random_uuid(),
  kursus_id    uuid not null references public.kursus (id) on delete cascade,
  pelanggan_id uuid not null references public.pelanggan (id) on delete cascade,
  dibuat_pada  timestamptz not null default now()
);

create unique index pendaftaran_idx on public.pendaftaran (kursus_id, pelanggan_id);

create trigger kursus_sentuh_diubah_pada
  before update on public.kursus
  for each row execute function public.sentuh_diubah_pada();

create trigger pelajaran_sentuh_diubah_pada
  before update on public.pelajaran
  for each row execute function public.sentuh_diubah_pada();

alter table public.kursus      enable row level security;
alter table public.modul       enable row level security;
alter table public.pelajaran   enable row level security;
alter table public.pendaftaran enable row level security;

-- Umum hanya melihat kursus yang sudah terbit, beserta isinya.
create policy "kursus terbit terbuka untuk umum"
  on public.kursus for select to anon, authenticated
  using (status = 'terbit');

create policy "modul ikut status kursusnya"
  on public.modul for select to anon, authenticated
  using (exists (
    select 1 from public.kursus k
    where k.id = modul.kursus_id and k.status = 'terbit'
  ));

create policy "pelajaran ikut status kursusnya"
  on public.pelajaran for select to anon, authenticated
  using (exists (
    select 1 from public.kursus k
    where k.id = pelajaran.kursus_id and k.status = 'terbit'
  ));

create policy "redaksi mengelola kursus"
  on public.kursus for all to authenticated using (true) with check (true);

create policy "redaksi mengelola modul"
  on public.modul for all to authenticated using (true) with check (true);

create policy "redaksi mengelola pelajaran"
  on public.pelajaran for all to authenticated using (true) with check (true);

create policy "redaksi mengelola pendaftaran"
  on public.pendaftaran for all to authenticated using (true) with check (true);

-- Pendaftaran kursus lewat fungsi, supaya daftar peserta tidak pernah
-- terbuka ke publik dan pendaftar otomatis ikut masuk daftar pembaca.
create or replace function public.daftar_kursus(p_slug text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bersih      text := lower(trim(p_email));
  id_kursus   uuid;
  id_pelanggan uuid;
begin
  if bersih is null or bersih !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Alamat email tidak sah';
  end if;

  select id into id_kursus
  from public.kursus
  where slug = p_slug and status = 'terbit';

  if id_kursus is null then
    raise exception 'Kursus tidak ditemukan';
  end if;

  insert into public.pelanggan (email, sumber)
  values (bersih, 'kursus:' || p_slug)
  on conflict (lower(email)) do update
    set status = 'aktif',
        berhenti_pada = null
  returning id into id_pelanggan;

  insert into public.pendaftaran (kursus_id, pelanggan_id)
  values (id_kursus, id_pelanggan)
  on conflict (kursus_id, pelanggan_id) do nothing;
end;
$$;

revoke all on function public.daftar_kursus(text, text) from public;
grant execute on function public.daftar_kursus(text, text) to anon, authenticated;
