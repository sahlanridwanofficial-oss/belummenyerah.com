import Link from 'next/link';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';
import BelumTersambung from '@/components/BelumTersambung';
import { NAMA_FORMAT, NAMA_JALUR, tanggalPendek } from '@/lib/format';
import type { Tulisan } from '@/lib/types';

export default async function DaftarTulisan() {
  if (!supabaseTerpasang()) {
    return (
      <div className="halaman" style={{ paddingBlock: 40 }}>
        <BelumTersambung />
      </div>
    );
  }

  const supabase = await klienServer();
  const { data } = await supabase
    .from('tulisan')
    .select('id, slug, judul, jalur, format, nomor, status, menit_baca, terbit_pada, diubah_pada')
    .order('diubah_pada', { ascending: false })
    .limit(200);

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
            {daftar.length > 0 ? `${terbit} terbit · ${draf} draf` : 'Belum ada tulisan'}
          </h1>
        </div>
        <Link href="/admin/tulis" className="tombol">
          Tulis catatan baru
        </Link>
      </div>

      {daftar.length === 0 ? (
        <div className="kosong tumpuk tumpuk-16">
          <span className="label">Kosong</span>
          <p style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 560 }}>
            Belum ada apa-apa di sini. Tulisan pertama biasanya yang paling berat — mulai saja dari
            satu pertanyaan yang sering kamu dengar dari pemilik usaha.
          </p>
        </div>
      ) : (
        <table className="admin-tabel">
          <thead>
            <tr>
              <th style={{ width: '46%' }}>Judul</th>
              <th>Jalur</th>
              <th>Format</th>
              <th>Status</th>
              <th>Terbit</th>
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
                    /catatan/{t.slug}
                  </span>
                </td>
                <td style={{ fontSize: 16 }}>{NAMA_JALUR[t.jalur]}</td>
                <td style={{ fontSize: 16 }}>
                  {NAMA_FORMAT[t.format]}
                  {t.nomor ? ` №${String(t.nomor).padStart(3, '0')}` : ''}
                </td>
                <td>
                  <span
                    className={t.status === 'terbit' ? 'lencana lencana-terbit' : 'lencana lencana-draf'}
                  >
                    {t.status}
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
      )}
    </div>
  );
}
