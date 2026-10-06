import ArrowIcon from "@/components/ArrowIcon";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import DontGiveUpTitle from "@/components/DontGiveUpTitle";
import CrowdScene from "@/components/CrowdScene";

export default function Beranda() {
  return (
    <div className="giveup-home">
      <Masthead ringkas />
      <main id="isi" className="giveup-main">
        <div className="giveup-stage">
          <div className="giveup-type">
            <p className="giveup-eyebrow">BEKAL BELAJAR UNTUK UMKM</p>
            <DontGiveUpTitle />
          </div>
          <CrowdScene />
          <svg className="giveup-spark" viewBox="0 0 70 70" aria-hidden="true"><path d="M35 5L36 25L53 13L42 31L65 34L43 39L54 57L37 46L32 67L29 45L11 55L22 38L4 33L26 29L17 12L32 24Z"/></svg>
        </div>
        <div className="giveup-invitation">
          <p>Usaha boleh kecil. Mimpi jangan.</p>
          <span>Belajar gratis. Tumbuh bareng. Lanjut lagi.</span>
          <div className="giveup-actions">
            <Link href="/belajar" className="giveup-button giveup-button--dark">Kelas gratis <ArrowIcon /></Link>
            <Link href="/tentang" className="giveup-button">Kenalan dulu <ArrowIcon /></Link>
          </div>
        </div>
      </main>
      <footer className="giveup-footer">
        <span>Selalu ada langkah berikutnya.</span>
        <nav aria-label="Tentang situs"><Link href="/tentang">Tentang</Link><Link href="/berlangganan">Kabar terbaru</Link></nav>
        <span>© {new Date().getFullYear()} Belum Menyerah</span>
      </footer>
    </div>
  );
}
