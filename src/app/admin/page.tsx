import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin-auth';
import { supabaseTerpasang } from '@/lib/supabase/server';
import BelumTersambung from '@/components/BelumTersambung';
import { NAMA_FORMAT, tanggalPendek } from '@/lib/format';
import type { Tulisan } from '@/lib/types';

export default async function DaftarTulisan() {
  if (!supabaseTerpasang()) {
    return (
      <div className="halaman" style={{ paddingBlock: 40 }}>
        <BelumTersambung />
      </div>
    );
  }

  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase
    .from('tulisan')
    .select('id, slug, judul, format, nomor, status, menit_baca, terbit_pada, diubah_pada')
    .order('diubah_pada', { ascending: false })
    .limit(200);

  if (error) return <div className="halaman" style={{ paddingBlock: 48 }}><h1 className="judul-seksi">Arsip tulisan</h1><p className="pesan-buruk" role="alert">Arsip belum bisa dimuat. Coba muat ulang halaman; data yang tersimpan tidak berubah.</p></div>;

  const daftar = (data ?? []) as unknown as Tulisan[];
  const draf = daftar.filter((t) => t.status === 'draf').length;
  const terbit = daftar.length - draf;

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
            {daftar.length > 0 ? `${terbit} siap dikirim · ${draf} draf` : 'Belum ada arsip tulisan'}
          </h1>
        </div>
        <Link href="/admin/tulis" className="tombol">
          Tulis catatan baru
        </Link>
      </div>

      <aside className="admin-catatan" style={{ marginBottom: 28 }}>
        <p><strong>Arsip tulisan dan newsletter</strong></p>
        <p>Tulisan di sini tersimpan di database. Menyimpan atau menandai siap dikirim tidak menambah atau mengubah artikel di blog publik.</p>
        <p>Blog publik saat ini dikelola melalui kode situs. <Link href="/blog" target="_blank" rel="noreferrer">Lihat blog publik ↗</Link></p>
      </aside>

      {daftar.length === 0 ? (
        <div className="kosong susun susun-16">
          <span className="label">Kosong</span>
          <p style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 560 }}>
            Belum ada apa-apa di sini. Tulisan pertama biasanya yang paling berat, jadi mulai saja dari
            satu pertanyaan yang sering kamu dengar dari pemilik usaha.
          </p>
        </div>
      ) : (
        <div className="bungkus-tabel">
          <table className="admin-tabel">
          <thead>
            <tr>
              <th style={{ width: '46%' }}>Judul</th>
              <th>Format</th>
              <th>Status</th>
              <th>Ditandai siap</th>
              <th>Diubah</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link href={`/admin/tulis/${t.id}`} style={{ fontSize: 18, lineHeight: 1.4 }}>
                    {t.judul}
                  </Link>
                  <span
                    className="pesan-kecil"
                    style={{ display: 'block', marginTop: 4, fontFamily: 'var(--sans)' }}
                  >
                    Slug arsip: {t.slug}
                  </span>
                </td>
                <td style={{ fontSize: 16 }}>
                  {NAMA_FORMAT[t.format]}
                  {t.nomor ? ` №${String(t.nomor).padStart(3, '0')}` : ''}
                </td>
                <td>
                  <span
                    className={t.status === 'terbit' ? 'lencana lencana-terbit' : 'lencana lencana-draf'}
                  >
                    {t.status === 'terbit' ? 'Siap dikirim' : 'Draf'}
                  </span>
                </td>
                <td style={{ fontSize: 15, color: 'var(--meta)' }}>
                  {tanggalPendek(t.terbit_pada)}
                </td>
                <td style={{ fontSize: 15, color: 'var(--meta)' }}>
                  {tanggalPendek(t.diubah_pada)}
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
