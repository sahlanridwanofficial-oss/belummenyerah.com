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
              Tautannya mungkin salah, atau halamannya sudah dipindahkan. Kamu bisa melanjutkan
              ke pilihan kursus gratis.
            </p>
            <Link
              href="/belajar"
              className="tombol tombol-garis"
              style={{ marginTop: 32, display: 'inline-block' }}
            >
              Lihat kursus gratis
            </Link>
          </div>
          <LabelHarga ukuran={200} />
        </div>
      </main>
      <Kaki />
    </>
  );
}
