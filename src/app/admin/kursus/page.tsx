import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin-auth';
import { supabaseTerpasang } from '@/lib/supabase/server';
import BelumTersambung from '@/components/BelumTersambung';
import { tanggalPendek } from '@/lib/format';
import { NAMA_TINGKAT } from '@/lib/kursus';
import type { Kursus } from '@/lib/types';

export default async function DaftarKursusRedaksi() {
  if (!supabaseTerpasang()) {
    return (
      <div className="halaman" style={{ paddingBlock: 40 }}>
        <BelumTersambung />
      </div>
    );
  }

  const { supabase } = await requireAdminPage();
  const [{ data: dataKursus, error: galatKursus }, { data: dataPelajaran, error: galatPelajaran }] = await Promise.all([
    supabase.from('kursus').select('*').order('urutan').order('diubah_pada', { ascending: false }),
    supabase.from('pelajaran').select('id, kursus_id'),
  ]);

  if (galatKursus || galatPelajaran) return <div className="halaman" style={{ paddingBlock: 48 }}><h1 className="judul-seksi">Kursus</h1><p className="pesan-buruk" role="alert">Daftar kursus belum bisa dimuat. Coba muat ulang halaman; data yang tersimpan tidak berubah.</p></div>;

  const daftar = (dataKursus ?? []) as Kursus[];
  const pelajaran = (dataPelajaran ?? []) as { id: string; kursus_id: string }[];

  return (
    <div className="halaman" style={{ paddingBlock: 48 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
          marginBottom: 36,
        }}
      >
        <div>
          <span className="kicker">Redaksi</span>
          <h1 className="judul-seksi" style={{ marginTop: 12 }}>
            {daftar.length > 0 ? `${daftar.length} kursus` : 'Belum ada kursus'}
          </h1>
        </div>
        <Link href="/admin/kursus/baru" className="tombol">
          Kursus baru
        </Link>
      </div>

      {daftar.length === 0 ? (
        <div className="kosong susun susun-16">
          <span className="label">Kosong</span>
          <p style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 560 }}>
            Kursus pertama paling gampang disusun dari tulisan yang sudah ada: ambil empat sampai
            enam catatan yang saling berhubungan, urutkan, lalu pecah jadi pelajaran pendek.
          </p>
        </div>
      ) : (
        <div className="bungkus-tabel">
          <table className="admin-tabel">
          <thead>
            <tr>
              <th style={{ width: '44%' }}>Judul</th>
              <th>Tingkat</th>
              <th>Pelajaran</th>
              <th>Status</th>
              <th>Diubah</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((k) => (
              <tr key={k.id}>
                <td>
                  <Link href={`/admin/kursus/${k.id}`} style={{ fontSize: 18, lineHeight: 1.4 }}>
                    {k.judul}
                  </Link>
                  <span
                    className="pesan-kecil"
                    style={{ display: 'block', marginTop: 4, fontFamily: 'var(--sans)' }}
                  >
                    /belajar/{k.slug}
                  </span>
                </td>
                <td style={{ fontSize: 16 }}>{NAMA_TINGKAT[k.tingkat]}</td>
                <td style={{ fontSize: 16 }}>
                  {pelajaran.filter((p) => p.kursus_id === k.id).length}
                </td>
                <td>
                  <span
                    className={
                      k.status === 'terbit' ? 'lencana lencana-terbit' : 'lencana lencana-draf'
                    }
                  >
                    {k.status}
                  </span>
                </td>
                <td style={{ fontSize: 15, color: 'var(--meta)' }}>
                  {tanggalPendek(k.diubah_pada)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
      )}
    </div>
  );
}
