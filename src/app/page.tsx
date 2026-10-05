import Link from "next/link";
import Masthead from "@/components/Masthead";
import Kaki from "@/components/Kaki";
import HumanStory from "@/components/HumanStory";
import FormLangganan from "@/components/FormLangganan";
import BelumTersambung from "@/components/BelumTersambung";
import KartuTulisan from "@/components/KartuTulisan";
import KartuKursus from "@/components/KartuKursus";
import { ambilTerbit } from "@/lib/tulisan";
import { ambilKatalogRingkas } from "@/lib/kursus";
import { supabaseTerpasang } from "@/lib/supabase/server";

export default async function Beranda() {
  const tersambung = supabaseTerpasang();
  const [tulisan, katalog] = tersambung
    ? await Promise.all([ambilTerbit(4), ambilKatalogRingkas()])
    : [[], []];

  return (
    <div className="sekolah-home">
      <Masthead />
      <main id="isi">
        <HumanStory />

        <section id="kelas" className="school-section school-classes" aria-labelledby="judul-kelas">
          <div className="halaman">
            <div className="school-section__head">
              <div>
                <span className="school-eyebrow">01 / KELAS ONLINE GRATIS</span>
                <h2 id="judul-kelas">Belajar hal baru.<br /><span>Buka kemungkinan.</span></h2>
              </div>
              <div className="school-section__aside">
                <p>Ilmu praktis untuk usaha sehari-hari. Belajar sesuai ritmemu, tanpa biaya dan tanpa akun.</p>
                <Link href="/belajar" className="school-text-link">Jelajahi kelas <span aria-hidden="true">↗</span></Link>
              </div>
            </div>

            {katalog.length > 0 ? (
              <div className="kartu-kursus-kisi school-course-grid">
                {katalog.slice(0, 4).map((kursus) => <KartuKursus key={kursus.id} kursus={kursus} />)}
              </div>
            ) : (
              <div className="school-course-preview nk-coming-class">
                <div className="school-course-preview__art" aria-hidden="true">
                  <span className="school-course-preview__label">SELALU ADA YANG BISA DIPELAJARI.</span>
                  <span className="school-course-preview__type">Mulai<br />dari rasa<br />ingin tahu.</span>
                  <span className="school-course-preview__arrow">↗</span>
                </div>
                <div className="school-course-preview__copy">
                  <span className="school-pill">SEDANG DISIAPKAN</span>
                  <h3>Kelas pertama.<br />Langkah berikutnya.</h3>
                  <p>Kami sedang menyusun kelas praktis untuk usaha kecil. Tinggalkan emailmu agar tahu saat kelas dibuka.</p>
                  <FormLangganan
                    sumber="kursus-kosong"
                    tombol="Kabari saya"
                    catatan="Juga berlangganan catatan Senin pagi. Gratis, berhenti kapan saja."
                  />
                </div>
              </div>
            )}

            <div className="school-learning-steps" aria-label="Cara belajar">
              <div><span>01</span><p><b>Pilih yang kamu butuhkan.</b> Mulai dari tantangan usahamu hari ini.</p></div>
              <div><span>02</span><p><b>Pelajari sesuai ritmemu.</b> Sedikit demi sedikit, saat kamu sempat.</p></div>
              <div><span>03</span><p><b>Bawa ke usahamu.</b> Praktikkan, evaluasi, lalu lanjutkan.</p></div>
            </div>
          </div>
        </section>

        <section id="media" className="school-section school-media halaman" aria-labelledby="judul-media">
          <div className="school-section__head">
            <div>
              <span className="school-eyebrow">02 / MEDIA BISNIS &amp; KEUANGAN</span>
              <h2 id="judul-media">Sudut pandang baru.<br /><span>Untuk langkahmu.</span></h2>
            </div>
            <div className="school-section__aside">
              <p>Praktis soal angka, jujur soal rasanya. Cerita dan wawasan yang dekat dengan realitas pemilik usaha.</p>
              <Link href="/blog" className="school-text-link">Jelajahi media <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          {tulisan.length > 0 ? (
            <div className="kartu-tulisan-kisi school-editorial-grid">
              {tulisan.map((t, index) => <KartuTulisan key={t.id} tulisan={t} utama={index === 0} />)}
            </div>
          ) : (
            <div className="school-editorial-empty nk-insight-empty">
              <span className="school-editorial-empty__mark" aria-hidden="true">↗</span>
              <div>
                <span className="school-eyebrow">DARI MEJA REDAKSI</span>
                <h3>Catatan pertama sedang disiapkan.</h3>
                <p>Wawasan bisnis dan keuangan untuk menemani proses membangun usaha. Kami sedang menyiapkan tulisan pertamanya.</p>
              </div>
              <Link href="/blog" className="school-text-link">Ke media <span aria-hidden="true">↗</span></Link>
            </div>
          )}
        </section>

        <section className="school-newsletter" aria-labelledby="judul-langganan">
          <div className="halaman school-newsletter__inside">
            <div>
              <span className="school-eyebrow">SATU EMAIL. BEKAL SEMINGGU.</span>
              <h2 id="judul-langganan">Terus belajar.<br />Tetap melangkah.</h2>
              <p>Satu catatan setiap Senin pagi. Gratis, tanpa iklan, tanpa tautan afiliasi. Berhenti kapan saja.</p>
            </div>
            <FormLangganan sumber="beranda" tombol="Langganan gratis" catatan="Kami tidak pernah membagikan alamat emailmu." />
          </div>
        </section>
        {!tersambung && <div className="halaman school-connection"><BelumTersambung /></div>}
      </main>
      <Kaki />
    </div>
  );
}
