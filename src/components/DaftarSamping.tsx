'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { bacaKemajuan } from '@/lib/kemajuan';
import type { ModulLengkap } from '@/lib/types';

/**
 * Daftar pelajaran di kolom samping, lengkap dengan tanda pelajaran yang
 * sudah selesai. Kemajuan dibaca dari browser, jadi daftarnya baru bisa
 * ditandai setelah komponen ini hidup di sisi klien.
 */
export default function DaftarSamping({
  kursusSlug,
  kursusJudul,
  modul,
  pelajaranAktif,
  total,
}: {
  kursusSlug: string;
  kursusJudul: string;
  modul: ModulLengkap[];
  pelajaranAktif: string;
  total: number;
}) {
  const [selesai, setSelesai] = useState<string[]>([]);

  const segarkan = useCallback(() => {
    setSelesai(bacaKemajuan(kursusSlug));
  }, [kursusSlug]);

  useEffect(() => {
    segarkan();
    window.addEventListener('kemajuan-berubah', segarkan);
    return () => window.removeEventListener('kemajuan-berubah', segarkan);
  }, [segarkan]);

  const jumlahSelesai = Math.min(selesai.length, total);

  return (
    <>
      <Link href={`/belajar/${kursusSlug}`} className="label" style={{ paddingBottom: 10 }}>
        ← {kursusJudul}
      </Link>

      {jumlahSelesai > 0 && (
        <span className="hitung-selesai">
          {jumlahSelesai} dari {total} pelajaran selesai
        </span>
      )}

      {modul.map((m, i) => (
        <div key={m.id} style={{ marginTop: 18 }}>
          <span className="label" style={{ paddingBottom: 8 }}>
            {String(i + 1).padStart(2, '0')} · {m.judul}
          </span>
          {m.pelajaran.map((p) => {
            const sudah = selesai.includes(p.slug);
            return (
              <Link
                key={p.id}
                href={`/belajar/${kursusSlug}/${p.slug}`}
                className={sudah ? 'samping-tautan sudah' : 'samping-tautan'}
                aria-current={p.slug === pelajaranAktif ? 'page' : undefined}
              >
                <span className="tanda-centang" aria-hidden="true">
                  {sudah ? '✓' : ''}
                </span>
                <span className="samping-judul">{p.judul}</span>
                {sudah && <span className="khusus-pembaca-layar">Sudah selesai</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}
