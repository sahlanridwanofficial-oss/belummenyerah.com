import Link from 'next/link';
import Logo from './Logo';

export default function Kaki() {
  return (
    <footer className="halaman kaki">
      <div className="kolom">
        <Logo />
        <span className="keterangan">
          Media bisnis kecil dan keuangan. Ditulis di Indonesia, untuk usaha di Indonesia.
        </span>
      </div>

      <div className="kolom">
        <span className="label">Jelajahi</span>
        <Link href="/blog">Blog</Link>
        <Link href="/belajar">Belajar</Link>
        <Link href="/tentang">Tentang</Link>
      </div>

      <div className="kolom">
        <span className="label">Langganan gratis</span>
        <Link href="/berlangganan">Daftar email</Link>
        <span className="keterangan">Satu catatan setiap Senin pagi. Gratis.</span>
      </div>

      <div className="kolom">
        <span className="label">Cara kami menulis</span>
        <Link href="/tentang">Janji editorial</Link>
        <span className="keterangan">
          Tidak ada artikel berbayar yang disamarkan, dan tidak ada pelacak pihak ketiga.
        </span>
      </div>
    </footer>
  );
}
