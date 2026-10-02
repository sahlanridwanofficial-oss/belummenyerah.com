import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';
import BelumTersambung from '@/components/BelumTersambung';
import { tanggalPendek } from '@/lib/format';
import type { Kiriman, Pelanggan } from '@/lib/types';

export default async function DaftarPelanggan() {
  if (!supabaseTerpasang()) {
    return (
      <div className="halaman" style={{ paddingBlock: 40 }}>
        <BelumTersambung />
      </div>
    );
  }

  const supabase = await klienServer();

  const [{ data: dataPelanggan }, { data: dataKiriman }] = await Promise.all([
    supabase
      .from('pelanggan')
      .select('id, email, status, sumber, dibuat_pada, berhenti_pada')
      .order('dibuat_pada', { ascending: false })
      .limit(500),
    supabase.from('kiriman').select('*').order('dikirim_pada', { ascending: false }).limit(10),
  ]);

  const pelanggan = (dataPelanggan ?? []) as unknown as Pelanggan[];
  const kiriman = (dataKiriman ?? []) as unknown as Kiriman[];
  const aktif = pelanggan.filter((p) => p.status === 'aktif').length;

  return (
    <div className="halaman" style={{ paddingBlock: 48 }}>
      <span className="kicker">Pelanggan</span>
      <h1 className="judul-seksi" style={{ marginTop: 12, marginBottom: 36 }}>
        {aktif} aktif · {pelanggan.length - aktif} berhenti
      </h1>

      {kiriman.length > 0 && (
        <div style={{ marginBottom: 44 }}>
          <span className="label" style={{ marginBottom: 12 }}>
            Kiriman terakhir
          </span>
          <div className="bungkus-tabel">
          <table className="admin-tabel">
            <thead>
              <tr>
                <th style={{ width: '58%' }}>Judul</th>
                <th>Terkirim</th>
                <th>Gagal</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {kiriman.map((k) => (
                <tr key={k.id}>
                  <td style={{ fontSize: 17 }}>{k.judul}</td>
                  <td style={{ fontSize: 16 }}>{k.jumlah_penerima}</td>
                  <td style={{ fontSize: 16, color: k.jumlah_gagal ? 'var(--bara)' : 'var(--meta)' }}>
                    {k.jumlah_gagal}
                  </td>
                  <td style={{ fontSize: 15, color: 'var(--meta)' }}>
                    {tanggalPendek(k.dikirim_pada)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {pelanggan.length === 0 ? (
        <div className="kosong susun susun-16">
          <span className="label">Masih kosong</span>
          <p style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 560 }}>
            Belum ada yang mendaftar. Pembaca pertama biasanya datang dari orang yang kamu ajak
            satu per satu lewat pesan pribadi, bukan dari postingan.
          </p>
        </div>
      ) : (
        <div className="bungkus-tabel">
          <table className="admin-tabel">
          <thead>
            <tr>
              <th style={{ width: '42%' }}>Email</th>
              <th>Status</th>
              <th>Dari</th>
              <th>Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {pelanggan.map((p) => (
              <tr key={p.id}>
                <td style={{ fontSize: 17 }}>{p.email}</td>
                <td>
                  <span
                    className={
                      p.status === 'aktif' ? 'lencana lencana-terbit' : 'lencana lencana-draf'
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td style={{ fontSize: 15, color: 'var(--meta)' }}>{p.sumber ?? '-'}</td>
                <td style={{ fontSize: 15, color: 'var(--meta)' }}>
                  {tanggalPendek(p.dibuat_pada)}
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
