'use client';

import { useEffect, useState } from 'react';
import { bacaKemajuan, simpanKemajuan } from '@/lib/kemajuan';

export default function TandaiSelesai({
  kursusSlug,
  pelajaranSlug,
}: {
  kursusSlug: string;
  pelajaranSlug: string;
}) {
  const [selesai, setSelesai] = useState(false);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setSelesai(bacaKemajuan(kursusSlug).includes(pelajaranSlug));
    setSiap(true);
  }, [kursusSlug, pelajaranSlug]);

  function alih() {
    const baru = !selesai;
    setSelesai(baru);
    simpanKemajuan(kursusSlug, pelajaranSlug, baru);
  }

  return (
    <button
      type="button"
      className={selesai ? 'tombol' : 'tombol tombol-garis'}
      onClick={alih}
      aria-pressed={selesai}
      style={{ visibility: siap ? 'visible' : 'hidden' }}
    >
      {selesai ? '✓ Sudah selesai' : 'Tandai sudah selesai'}
    </button>
  );
}
