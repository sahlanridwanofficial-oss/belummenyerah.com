import Link from "next/link";
import { TandaLogo } from "./Logo";

export default function Kaki() {
  return (
    <footer className="kaki">
      <div className="halaman kaki-isi">
        <div className="kaki-identitas">
          <Link href="/" className="tautan-logo" aria-label="belummenyerah, ke beranda">
            <TandaLogo ukuran={64} />
          </Link>
          <p>Sekolah dan media untuk UMKM.<br />Belajar. Bertumbuh. Bersama.</p>
        </div>
        <nav className="kaki-tautan" aria-label="Navigasi kaki halaman">
          <Link href="/belajar">Kelas gratis <span aria-hidden="true">↗</span></Link>
          <Link href="/blog">Media <span aria-hidden="true">↗</span></Link>
          <Link href="/tentang">Tentang kami <span aria-hidden="true">↗</span></Link>
          <Link href="/berlangganan">Langganan gratis <span aria-hidden="true">↗</span></Link>
        </nav>
        <div className="kaki-bawah">
          <span>Untuk usaha yang terus melangkah.</span>
          <Link href="/tentang">Janji editorial</Link>
          <Link href="/kredit">Kredit visual 3D</Link>
          <span>Tanpa pelacak pihak ketiga.</span>
        </div>
      </div>
    </footer>
  );
}
