import type { FormatTulisan, Topik } from './types';

export const TOPIK: { kode: Topik; nama: string; ringkas: string; pertanyaan: string }[] = [
  {
    kode: 'bertahan',
    nama: 'Bertahan',
    ringkas: 'Kas, utang, dan bulan-bulan sepi.',
    pertanyaan: 'Uangku habis sebelum akhir bulan. Mana yang harus kupotong lebih dulu?',
  },
  {
    kode: 'bangun',
    nama: 'Bangun',
    ringkas: 'Harga, margin, dan cara kerja.',
    pertanyaan: 'Aku sibuk terus tapi untungnya tipis. Harganya yang salah atau caranya?',
  },
  {
    kode: 'uang-pribadi',
    nama: 'Uang Pribadi',
    ringkas: 'Dompet pemilik, bukan dompet usaha.',
    pertanyaan: 'Berapa yang boleh kuambil untuk diriku sendiri bulan ini?',
  },
];

export const NAMA_TOPIK: Record<Topik, string> = {
  bertahan: 'Bertahan',
  bangun: 'Bangun',
  'uang-pribadi': 'Uang Pribadi',
};

/**
 * Cerita bukan topik, melainkan seri: wawancara panjang dengan pemilik
 * usaha yang pernah hampir berhenti. Tiap wawancara tetap punya topik
 * sesuai isinya, dan dikumpulkan di /cerita lewat formatnya.
 */
export const SERI_CERITA = {
  nama: 'Cerita',
  judul: 'Hampir Nyerah',
  ringkas: 'Wawancara dengan mereka yang pernah hampir berhenti.',
} as const;

export const NAMA_FORMAT: Record<FormatTulisan, string> = {
  catatan: 'Catatan',
  'satu-halaman': 'Satu Halaman',
  panduan: 'Panduan',
  wawancara: 'Wawancara',
};

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function tanggalPanjang(iso: string | null): string {
  if (!iso) return 'Belum terbit';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Belum terbit';
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function tanggalPendek(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

/** Rata-rata baca bahasa Indonesia berkisar 200 kata per menit. */
export function hitungMenitBaca(isi: string): number {
  const kata = isi.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(kata / 200));
}

export function buatSlug(judul: string): string {
  return judul
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function penanda(format: FormatTulisan, topik: Topik, nomor: number | null): string {
  const bagian = [NAMA_TOPIK[topik]];
  if (nomor) bagian.push(`${NAMA_FORMAT[format]} №${String(nomor).padStart(3, '0')}`);
  else bagian.push(NAMA_FORMAT[format]);
  return bagian.join(' · ');
}
