import Link from 'next/link';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Berhenti berlangganan',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function HalamanBerhenti({ searchParams }: Props) {
  const { token } = await searchParams;

  let hasil: 'tanpa-token' | 'berhasil' | 'gagal' = 'tanpa-token';

  if (token && supabaseTerpasang()) {
    const supabase = await klienServer();
    const { data, error } = await supabase.rpc('berhenti_langganan', { p_token: token });
    hasil = !error && data === true ? 'berhasil' : 'gagal';
  } else if (token) {
    hasil = 'gagal';
  }

  return (
    <>
      <Masthead />

      <main id="isi" className="halaman utama">
        <div style={{ maxWidth: 680 }}>
          {hasil === 'berhasil' && (
            <>
              <span className="kicker">Selesai</span>
              <h1 className="judul-artikel" style={{ marginTop: 18 }}>
                Kamu sudah berhenti berlangganan.
              </h1>
              <p className="deck" style={{ marginTop: 20 }}>
                Tidak akan ada kiriman lagi dari kami. Terima kasih sudah pernah membaca — pintunya
                tetap terbuka kalau suatu hari mau kembali.
              </p>
            </>
          )}

          {hasil === 'gagal' && (
            <>
              <span className="kicker">Tautannya tidak berlaku</span>
              <h1 className="judul-artikel" style={{ marginTop: 18 }}>
                Kami tidak menemukan langganan itu.
              </h1>
              <p className="deck" style={{ marginTop: 20 }}>
                Mungkin kamu sudah berhenti sebelumnya, atau tautannya tidak lengkap saat disalin.
                Kalau masih menerima kiriman, balas saja emailnya — akan kami urus langsung.
              </p>
            </>
          )}

          {hasil === 'tanpa-token' && (
            <>
              <span className="kicker">Berhenti berlangganan</span>
              <h1 className="judul-artikel" style={{ marginTop: 18 }}>
                Tautannya kurang lengkap.
              </h1>
              <p className="deck" style={{ marginTop: 20 }}>
                Buka tautan “berhenti berlangganan” yang ada di bagian bawah salah satu kiriman
                kami, supaya kami tahu langganan mana yang dimaksud.
              </p>
            </>
          )}

          <Link
            href="/"
            className="tombol tombol-garis"
            style={{ marginTop: 32, display: 'inline-block' }}
          >
            Kembali ke beranda
          </Link>
        </div>
      </main>

      <Kaki />
    </>
  );
}
