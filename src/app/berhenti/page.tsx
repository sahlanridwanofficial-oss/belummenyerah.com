import Link from 'next/link';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';

export const metadata: Metadata = {
  title: 'Berhenti berlangganan',
  robots: { index: false, follow: false },
  referrer: 'strict-origin',
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ token?: string; hasil?: string }> };

/** Viewing an email link must never change a subscription (including link scanners). */
export default async function HalamanBerhenti({ searchParams }: Props) {
  const { token, hasil } = await searchParams;
  const lengkap = typeof token === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  const gagal = hasil === 'gagal';

  return (
    <>
      <Masthead />
      <main id="isi" className="halaman utama">
        <div style={{ maxWidth: 680 }}>
          <span className="kicker">Berhenti berlangganan</span>
          <h1 className="judul-artikel" style={{ marginTop: 18 }}>
            {gagal ? 'Permintaan belum berhasil diproses.'
                : lengkap ? 'Ingin berhenti menerima email?'
                  : 'Tautannya kurang lengkap.'}
          </h1>
          <p className="deck" style={{ marginTop: 20 }} role={gagal ? 'alert' : undefined}>
            {gagal ? 'Tautan mungkin sudah tidak berlaku atau layanan sedang bermasalah. Coba lagi, atau buka tautan dari email terbaru kami.'
                : lengkap ? 'Langgananmu belum berubah. Tekan tombol di bawah untuk mengonfirmasi berhenti berlangganan.'
                  : 'Buka tautan “berhenti berlangganan” di bagian bawah salah satu email kami untuk mengonfirmasi langganan yang ingin dihentikan.'}
          </p>
          {lengkap && (
            <form action="/berhenti/konfirmasi" method="post" style={{ marginTop: 28 }}>
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="tombol">Ya, berhenti berlangganan</button>
            </form>
          )}
          <Link href="/" className="tombol tombol-garis" style={{ marginTop: 32, display: 'inline-block' }}>
            {lengkap ? 'Batal, kembali ke beranda' : 'Kembali ke beranda'}
          </Link>
        </div>
      </main>
      <Kaki />
    </>
  );
}
