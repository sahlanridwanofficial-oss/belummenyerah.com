# belummenyerah

Media edukasi bisnis kecil dan keuangan — praktis soal angka, jujur soal rasanya.

Next.js (App Router) + Supabase + Resend, dipasang di Vercel.

---

## Isinya

**Situs publik**

| Alamat | Isi |
| --- | --- |
| `/` | Beranda: tulisan terbaru, seri Cerita, tiga topik, kursus |
| `/baca` | Semua tulisan, dengan saringan topik |
| `/baca/[slug]` | Halaman tulisan |
| `/topik/bertahan`, `/topik/bangun`, `/topik/uang-pribadi` | Tulisan per topik |
| `/cerita` | Seri wawancara "Hampir Nyerah" |
| `/belajar` | Katalog kursus |
| `/belajar/[slug]` | Halaman kursus |
| `/belajar/[slug]/[pelajaran]` | Halaman pelajaran |
| `/tentang` | Posisi, nada, dan tiga saringan sebelum terbit |
| `/berlangganan` | Halaman pendaftaran |
| `/berhenti?token=…` | Berhenti berlangganan |

Menu utamanya **Baca · Belajar · Tentang · Berlangganan** — dibagi menurut niat
pembaca, bukan menurut topik. Topik jadi saringan di dalam halaman Baca.

**Topik** ada tiga: Bertahan, Bangun, Uang Pribadi. **Cerita bukan topik**
melainkan seri; halaman `/cerita` mengumpulkan semua tulisan berformat
`wawancara`, dan tiap wawancara tetap punya topik sesuai isinya.

**Panel redaksi** (perlu login, tertutup oleh middleware)

| Alamat | Isi |
| --- | --- |
| `/admin` | Daftar tulisan, draf dan terbit |
| `/admin/tulis` | Tulisan baru |
| `/admin/tulis/[id]` | Sunting, terbitkan, kirim ke pelanggan, hapus |
| `/admin/pelanggan` | Daftar pelanggan dan riwayat kiriman |

---

## Pemasangan

### 1. Database

Buat proyek Supabase, lalu jalankan `supabase/migrations/0001_awal.sql` di SQL Editor.

Migrasi itu membuat tiga tabel (`tulisan`, `pelanggan`, `kiriman`), menyalakan Row Level
Security, dan memasang dua fungsi publik: `daftar_pelanggan` dan `berhenti_langganan`.
Daftar pelanggan tidak pernah bisa dibaca dari sisi publik — pendaftaran hanya lewat fungsi.

### 2. Akun redaksi

Supabase → Authentication → Users → **Add user**. Isi email dan kata sandi, centang
*Auto Confirm User*. Akun itu yang dipakai masuk ke `/admin`.

### 3. Variabel lingkungan

Salin `.env.example` jadi `.env.local` untuk pengembangan, dan isi nilai yang sama di
Vercel → Settings → Environment Variables untuk produksi.

| Nama | Dari mana |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sama, kunci `anon` / `publishable` |
| `NEXT_PUBLIC_SITUS_URL` | alamat situs, mis. `https://belummenyerah.com` |
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `EMAIL_PENGIRIM` | mis. `belummenyerah <catatan@belummenyerah.com>` — domainnya harus sudah diverifikasi di Resend |
| `EMAIL_BALASAN` | opsional, alamat untuk balasan pembaca |

Tanpa Supabase, situs tetap berdiri dan menampilkan keterangan "belum tersambung".
Tanpa Resend, pendaftaran tetap jalan — hanya pengiriman emailnya yang mati.


> **Penting soal `NEXT_PUBLIC_*`**
> Next.js menanam variabel berawalan `NEXT_PUBLIC_` ke dalam kode saat *build*,
> bukan saat aplikasi berjalan. Jadi kalau nilainya ditambah atau diubah di
> Vercel, situsnya **harus di-deploy ulang** — kalau tidak, halaman akan tetap
> menampilkan "Belum tersambung" meski variabelnya sudah terisi.
> `RESEND_API_KEY` dan `EMAIL_PENGIRIM` tidak berawalan `NEXT_PUBLIC_`, jadi
> keduanya dibaca saat berjalan dan tidak butuh build ulang.

### 4. Jalankan

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build produksi
```

---

## Cara menulis

Tulisan ditulis dalam Markdown di `/admin/tulis`. Ada tab **Pratinjau** untuk melihat
hasilnya sebelum disimpan.

- **Slug** terisi otomatis dari judul, boleh ditimpa.
- **Menit baca** dihitung otomatis (200 kata per menit).
- **Tanggal terbit** dikunci sekali, saat pertama kali statusnya jadi `terbit` — menyunting
  ulang tidak menggesernya.
- **Kirim ke pelanggan** hanya aktif setelah tulisan berstatus terbit. Pengiriman dilakukan
  per 100 alamat, dan setiap surat membawa tautan berhenti berlangganan miliknya sendiri.

Isi tulisan dirender tanpa penyaring HTML, karena hanya redaksi yang bisa menulis.
Kalau nanti ada penulis tamu, pasang sanitiser lebih dulu di `src/lib/markdown.ts`.

---

## Kursus

Selain artikel, situs ini menampung kursus gratis. Susunannya **kursus → modul →
pelajaran**, dan tiap pelajaran boleh berupa tulisan, video, atau dua-duanya.

| Alamat | Isi |
| --- | --- |
| `/kursus` | Katalog kursus |
| `/kursus/[slug]` | Halaman kursus: ringkasan, daftar isi, pendaftaran |
| `/kursus/[slug]/[pelajaran]` | Halaman pelajaran dengan daftar isi di samping |
| `/admin/kursus` | Daftar kursus |
| `/admin/kursus/[id]` | Keterangan kursus plus penyusun modul dan pelajaran |
| `/admin/kursus/[id]/pelajaran/[pid]` | Editor satu pelajaran |

**Video** disematkan dari YouTube lewat `youtube-nocookie`, jadi tidak ada cookie
pelacak sebelum peserta menekan putar. Setel videonya sebagai *Unlisted* supaya
tidak muncul di kanal publik. Kolom tautannya menerima bentuk apa pun —
`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/` — dan mengambil idnya sendiri.

**Kemajuan belajar** disimpan di `localStorage` peramban peserta, bukan di server.
Konsekuensinya: peserta bisa langsung belajar tanpa membuat akun, tapi kemajuannya
tidak ikut pindah perangkat. Kalau nanti pembaca perlu akun, pindahkan isi
`src/lib/kemajuan.ts` ke sebuah tabel.

**Pendaftaran kursus** memakai ulang tabel `pelanggan`, supaya peserta kursus dan
pembaca newsletter tidak terpecah jadi dua daftar. Materinya tetap terbuka tanpa
mendaftar — pendaftaran hanya untuk dikabari kalau ada materi baru.

---

## Sistem desain

Ada di `src/app/globals.css`, dan versi lengkapnya di kanvas konsep.

- **Warna** — Kertas `#FCFBF8`, Tinta `#191714`, Bara `#9C3B23`, Arang `#1A1815`.
  Aturan 90 / 8 / 2: sembilan puluh persen kertas, delapan persen tinta, dua persen bara.
- **Huruf** — Instrument Serif (judul), Newsreader (badan teks), Instrument Sans (label dan
  navigasi). Ketiganya dari Google Fonts.
- **Baca** — badan teks 19px, tinggi baris 1,65, lebar kolom 680px. Jatuh di sekitar
  66 huruf per baris.
- **Aturan** — tanpa gradien, tanpa bayangan, tanpa sudut melengkung. Pemisah selalu garis
  rambut satu piksel.
- **Garis belum** — tanda khas: garis padat 68 persen lalu titik-titik. Ada di
  `src/components/GarisBelum.tsx`.

---

## Susunan berkas

```
src/
  app/
    page.tsx              beranda
    [jalur]/              arsip per jalur
    catatan/[slug]/       halaman tulisan
    admin/                panel redaksi
      aksi.ts             server action: simpan & hapus
    api/
      berlangganan/       pendaftaran pelanggan
      kirim/              pengiriman newsletter
    globals.css           seluruh sistem desain
  components/
  lib/
    format.ts             jalur, format, tanggal, slug, menit baca
    markdown.ts
    email.ts              templat surat
    tulisan.ts            kueri baca
    supabase/
  middleware.ts           penyegar sesi + penjaga /admin
supabase/migrations/
```
