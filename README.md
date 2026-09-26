# belummenyerah

Media edukasi bisnis kecil dan keuangan — praktis soal angka, jujur soal rasanya.

Next.js (App Router) + Supabase + Resend, dipasang di Vercel.

---

## Isinya

**Situs publik**

| Alamat | Isi |
| --- | --- |
| `/` | Beranda: terbitan terbaru, seri Hampir Nyerah, empat jalur |
| `/bertahan`, `/bangun`, `/uang-pribadi`, `/cerita` | Arsip per jalur |
| `/catatan/[slug]` | Halaman tulisan |
| `/arsip` | Semua terbitan |
| `/berlangganan` | Halaman pendaftaran |
| `/tentang` | Posisi, nada, dan tiga saringan sebelum terbit |
| `/berhenti?token=…` | Berhenti berlangganan |

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

## Sistem desain

Ada di `src/app/globals.css`, dan versi lengkapnya di kanvas konsep.

- **Warna** — Kertas `#F7F4EE`, Tinta `#191714`, Bara `#9C3B23`, Arang `#1A1815`.
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
