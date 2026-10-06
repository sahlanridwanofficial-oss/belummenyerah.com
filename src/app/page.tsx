import ArrowIcon from "@/components/ArrowIcon";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import DontGiveUpTitle from "@/components/DontGiveUpTitle";
import CrowdScene from "@/components/CrowdScene";
import { ARTIKEL_BLOG } from "@/lib/blog";

export default function Beranda() {
  return (
    <>
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
            <Link href="/belajar" className="giveup-button giveup-button--dark">Kelas gratis</Link>
            <Link href="/tentang" className="giveup-button">Kenalan dulu</Link>
          </div>
        </div>
      </main>
      <footer className="giveup-footer">
        <span>Selalu ada langkah berikutnya.</span>
        <nav aria-label="Tentang situs"><Link href="/tentang">Tentang</Link><Link href="/berlangganan">Kabar terbaru</Link></nav>
        <span>© {new Date().getFullYear()} Belum Menyerah</span>
      </footer>
    </div>
    <section className="halaman beranda-blog" aria-labelledby="beranda-blog-judul">
      <div className="beranda-blog__head">
        <div>
          <span className="kicker">Blog</span>
          <h2 id="beranda-blog-judul">Bacaan buat langkah berikutnya.</h2>
        </div>
        <Link href="/blog">Semua tulisan <ArrowIcon /></Link>
      </div>
      <div className="beranda-blog__kisi">
        {ARTIKEL_BLOG.map((artikel) => (
          <article key={artikel.slug} className="beranda-blog__kartu">
            <Link href={`/blog/${artikel.slug}`} className="beranda-blog__tautan" aria-label={`Baca: ${artikel.judul}`}>
              <span className="blog-baru__waktu">{artikel.menitBaca} menit baca</span>
              <h3>{artikel.judul}</h3>
              <p>{artikel.ringkasan}</p>
              <span className="blog-baru__baca">Baca <ArrowIcon /></span>
            </Link>
          </article>
        ))}
      </div>
    </section>
    </>
  );
}
