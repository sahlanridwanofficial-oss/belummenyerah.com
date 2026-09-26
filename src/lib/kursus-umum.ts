/**
 * Pembantu kursus yang murni — tanpa sentuhan server.
 * Dipisah supaya komponen klien bisa memakainya tanpa ikut menarik
 * `next/headers` lewat lib/kursus.ts.
 */

export const NAMA_TINGKAT = {
  pemula: 'Pemula',
  menengah: 'Menengah',
  lanjut: 'Lanjut',
} as const;

/**
 * Mengambil id video YouTube dari bentuk tautan apa pun yang lazim dipakai:
 * watch?v=, youtu.be/, /embed/, /live/, /shorts/, atau id telanjang.
 */
export function idYouTube(url: string | null): string | null {
  if (!url) return null;
  const bersih = url.trim();
  if (!bersih) return null;

  const pola = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/live\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];

  for (const p of pola) {
    const cocok = bersih.match(p);
    if (cocok) return cocok[1];
  }

  return /^[A-Za-z0-9_-]{11}$/.test(bersih) ? bersih : null;
}
