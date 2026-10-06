import ArrowIcon from "@/components/ArrowIcon";
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
          <p>Bekal belajar untuk UMKM.<br />Belajar. Bertumbuh. Bersama.</p>
        </div>
        <nav className="kaki-tautan" aria-label="Navigasi kaki halaman">
          <Link href="/belajar">Kelas gratis <ArrowIcon /></Link>
          <Link href="/blog">Blog <ArrowIcon /></Link>
          <Link href="/tentang">Tentang kami <ArrowIcon /></Link>
          <Link href="/berlangganan">Langganan gratis <ArrowIcon /></Link>
        </nav>
        <div className="kaki-bawah">
          <span>Untuk usaha yang terus melangkah.</span>
          <Link href="/tentang">Tentang kami</Link>
          <Link href="/kredit">Kredit visual 3D</Link>
          <span>Tanpa pelacak pihak ketiga.</span>
        </div>
      </div>
    </footer>
  );
}
