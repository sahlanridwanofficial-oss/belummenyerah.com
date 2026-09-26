'use client';

/**
 * Kemajuan belajar disimpan di browser peserta, bukan di server.
 * Tanpa akun, tanpa gesekan — konsekuensinya kemajuan tidak ikut pindah
 * perangkat. Kalau nanti pembaca punya akun, pindahkan ke tabel.
 */

const AWALAN = 'bm:kemajuan:';

function kunci(kursusSlug: string) {
  return `${AWALAN}${kursusSlug}`;
}

export function bacaKemajuan(kursusSlug: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const mentah = window.localStorage.getItem(kunci(kursusSlug));
    if (!mentah) return [];
    const isi = JSON.parse(mentah);
    return Array.isArray(isi) ? isi.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function simpanKemajuan(kursusSlug: string, pelajaranSlug: string, selesai: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const sekarang = new Set(bacaKemajuan(kursusSlug));
    if (selesai) sekarang.add(pelajaranSlug);
    else sekarang.delete(pelajaranSlug);
    window.localStorage.setItem(kunci(kursusSlug), JSON.stringify([...sekarang]));
    window.dispatchEvent(new CustomEvent('kemajuan-berubah', { detail: { kursusSlug } }));
  } catch {
    // Penyimpanan browser bisa ditolak (mode privat, kuota penuh).
    // Halaman tetap berjalan, hanya kemajuannya yang tidak tersimpan.
  }
}
