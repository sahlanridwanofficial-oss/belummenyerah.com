import type { FormatTulisan } from './types';



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
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
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

export function penanda(format: FormatTulisan, nomor: number | null): string {
  return nomor
    ? `${NAMA_FORMAT[format]} №${String(nomor).padStart(3, '0')}`
    : NAMA_FORMAT[format];
}
