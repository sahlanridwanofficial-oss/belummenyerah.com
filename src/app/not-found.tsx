import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import { LabelHarga } from '@/components/Ilustrasi';

export default function TidakDitemukan() {
  return (
    <>
      <Masthead />
      <main id="isi" className="halaman utama">
        <div className="kepala-ilustrasi">
          <div style={{ maxWidth: 640 }}>
            <span className="kicker">404</span>
            <h1 className="judul-raksasa" style={{ marginTop: 18 }}>
              Halaman ini tidak ada.
            </h1>
            <p className="deck" style={{ marginTop: 20 }}>
              Tautannya mungkin salah, atau tulisannya sudah dipindahkan. Semua tulisan yang terbit
              ada di halaman Blog.
            </p>
            <Link
              href="/blog"
              className="tombol tombol-garis"
              style={{ marginTop: 32, display: 'inline-block' }}
            >
              Lihat semua tulisan
            </Link>
          </div>
          <LabelHarga ukuran={200} />
        </div>
      </main>
      <Kaki />
    </>
  );
}
