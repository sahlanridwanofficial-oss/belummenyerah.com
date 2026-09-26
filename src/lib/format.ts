import type { FormatTulisan, Jalur } from './types';

export const JALUR: { kode: Jalur; nama: string; ringkas: string; pertanyaan: string }[] = [
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
  {
    kode: 'cerita',
    nama: 'Cerita',
    ringkas: 'Wawancara dengan yang hampir berhenti.',
    pertanyaan: 'Apa cuma aku yang pernah sampai di titik mau berhenti?',
  },
];

export const NAMA_JALUR: Record<Jalur, string> = {
  bertahan: 'Bertahan',
  bangun: 'Bangun',
  'uang-pribadi': 'Uang Pribadi',
  cerita: 'Cerita',
};

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

export function penanda(format: FormatTulisan, jalur: Jalur, nomor: number | null): string {
  const bagian = [NAMA_JALUR[jalur]];
  if (nomor) bagian.push(`${NAMA_FORMAT[format]} №${String(nomor).padStart(3, '0')}`);
  else bagian.push(NAMA_FORMAT[format]);
  return bagian.join(' · ');
}
