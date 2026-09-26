'use client';

import { useCallback, useEffect, useState } from 'react';
import { bacaKemajuan } from '@/lib/kemajuan';

export default function KemajuanKursus({
  kursusSlug,
  total,
}: {
  kursusSlug: string;
  total: number;
}) {
  const [selesai, setSelesai] = useState(0);
  const [siap, setSiap] = useState(false);

  const segarkan = useCallback(() => {
    setSelesai(bacaKemajuan(kursusSlug).length);
  }, [kursusSlug]);

  useEffect(() => {
    segarkan();
    setSiap(true);
    window.addEventListener('kemajuan-berubah', segarkan);
    return () => window.removeEventListener('kemajuan-berubah', segarkan);
  }, [segarkan]);

  if (!siap || total === 0 || selesai === 0) return null;

  const persen = Math.round((Math.min(selesai, total) / total) * 100);

  return (
    <div className="tumpuk tumpuk-8" style={{ marginTop: 22 }}>
      <span className="label">
        {selesai} dari {total} pelajaran selesai
      </span>
      <div
        style={{ display: 'flex', height: 6, width: '100%', border: '1px solid var(--garis)' }}
        role="progressbar"
        aria-valuenow={persen}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Kemajuan belajar"
      >
        <span style={{ width: `${persen}%`, background: 'var(--bara)' }} />
      </div>
    </div>
  );
}
