import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';

export default function TidakDitemukan() {
  return (
    <>
      <Masthead />
      <main id="isi" className="halaman utama">
        <div style={{ maxWidth: 640 }}>
          <span className="kicker">404</span>
          <h1 className="judul-raksasa" style={{ marginTop: 18 }}>
            Halaman ini tidak ada.
          </h1>
          <p className="deck" style={{ marginTop: 20 }}>
            Mungkin tautannya salah ketik, atau tulisannya belum terbit. Arsipnya masih lengkap di
            tempatnya.
          </p>
          <Link
            href="/baca"
            className="tombol tombol-garis"
            style={{ marginTop: 32, display: 'inline-block' }}
          >
            Lihat arsip
          </Link>
        </div>
      </main>
      <Kaki />
    </>
  );
}
