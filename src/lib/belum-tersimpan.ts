'use client';

import { useEffect, useRef } from 'react';

/**
 * Menjaga tulisan yang sedang digarap supaya tidak hilang karena tab
 * ditutup. Isi editor diringkas jadi satu teks; selama teks itu berbeda
 * dari yang terakhir disimpan, peramban menanyakan konfirmasi sebelum
 * halaman ditinggalkan.
 *
 * Panggil `tandaiTersimpan` dengan ringkasan terbaru setiap kali
 * penyimpanan berhasil.
 */
export function useBelumTersimpan(sekarang: string, awal: string) {
  const tersimpan = useRef(awal);
  const belumTersimpan = sekarang !== tersimpan.current;

  useEffect(() => {
    if (!belumTersimpan) return;
    function tanya(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', tanya);
    return () => window.removeEventListener('beforeunload', tanya);
  }, [belumTersimpan]);

  return {
    belumTersimpan,
    tandaiTersimpan: (nilai: string) => {
      tersimpan.current = nilai;
    },
  };
}
