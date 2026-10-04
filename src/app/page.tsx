import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import BelumTersambung from '@/components/BelumTersambung';
import KartuKas from '@/components/KartuKas';
import KartuTulisan from '@/components/KartuTulisan';
import KartuKursus from '@/components/KartuKursus';
import { TandaLogo } from '@/components/Logo';
import { DuaDompet, Laci, LabelHarga } from '@/components/Ilustrasi';
import { ambilTerbit } from '@/lib/tulisan';
import { ambilKatalogRingkas } from '@/lib/kursus';
import { supabaseTerpasang } from '@/lib/supabase/server';
import { SARINGAN } from '@/lib/redaksi';

const JADWAL = [
  { hari: 'Senin', apa: 'Satu tulisan utama tentang kas, harga, atau utang.' },
  { hari: 'Kamis', apa: 'Panduan singkat atau cerita pemilik usaha.' },
  { hari: 'Selalu', apa: 'Tanpa iklan dan tanpa tautan afiliasi.' },
];

const YANG_DIBAHAS = [
  {
    Gambar: Laci,
    judul: 'Kas dan arus uang',
    isi: 'Berapa uang yang benar-benar kamu pegang bulan ini, dan berapa yang sebenarnya sudah jadi milik pemasok, pemilik tempat, dan karyawan.',
  },
  {
    Gambar: LabelHarga,
    judul: 'Harga dan margin',
    isi: 'Cara menghitung harga jual supaya usaha masih hidup setelah semua biaya dibayar, bukan sekadar ikut harga tetangga.',
  },
  {
    Gambar: DuaDompet,
    judul: 'Dompet pribadi dan usaha',
    isi: 'Cara memisahkan uang usaha dari uang rumah tangga, dan menentukan berapa gaji yang boleh kamu ambil setiap bulan.',
  },
];

export default async function Beranda() {
  const tersambung = supabaseTerpasang();
  const [tulisan, katalog] = tersambung
    ? await Promise.all([ambilTerbit(5), ambilKatalogRingkas()])
    : [[], []];

  return (
    <>
      <Masthead />

      <main id="isi">
        {!tersambung && (
          <div className="halaman">
            <BelumTersambung />
          </div>
        )}

        <section className="halaman hero">
          <div>
            <span className="kicker">Media bisnis kecil &amp; keuangan</span>
            <h1 className="hero-judul" style={{ marginTop: 22 }}>
              Omzet besar belum tentu <em>ada sisanya.</em>
            </h1>
            <p className="deck" style={{ marginTop: 24, maxWidth: 560 }}>
              Kami menjelaskan uang usaha kecil dengan bahasa manusia, untuk kamu yang sedang
              melewati bulan terberat. Praktis soal angka, jujur soal rasanya.
            </p>
            <div style={{ marginTop: 34, maxWidth: 520 }}>
              <FormLangganan
                sumber="beranda-hero"
                tombol="Kirim ke email saya"
                catatan="Satu catatan setiap Senin pagi. Gratis, tanpa iklan."
              />
            </div>
          </div>

          <KartuKas />
        </section>

        <section className="pita-jadwal" aria-label="Isi langganan">
          <div className="halaman pita-jadwal-isi">
            {JADWAL.map((j) => (
              <div key={j.hari}>
                <span className="hari">{j.hari}</span>
                <span className="apa">{j.apa}</span>
              </div>
            ))}
          </div>
        </section>

        {tulisan.length > 0 && (
          <section className="halaman seksi" style={{ paddingTop: 76 }}>
            <div className="kepala-seksi">
              <span className="label">Tulisan terbaru</span>
              <Link href="/blog" className="label tautan-lihat">
                Semua tulisan →
              </Link>
            </div>
            <div className="kartu-tulisan-kisi">
              {tulisan.map((t, i) => (
                <KartuTulisan key={t.id} tulisan={t} utama={i === 0} />
              ))}
            </div>
          </section>
        )}

        <section className="pita-gelap" style={{ marginTop: tulisan.length > 0 ? 88 : 0 }}>
          <div className="halaman">
            <span className="kicker">Yang dibahas di sini</span>
            <h2 className="pita-gelap-judul" style={{ marginTop: 18 }}>
              Tiga hal yang paling sering membuat usaha kecil tutup, padahal bisa dihitung.
            </h2>
            <div className="topik-kisi">
              {YANG_DIBAHAS.map(({ Gambar, judul, isi }) => (
                <div key={judul} className="topik">
                  <Gambar />
                  <div className="susun susun-8">
                    <span className="topik-judul">{judul}</span>
                    <p className="topik-isi">{isi}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {katalog.length > 0 && (
          <section className="halaman seksi" style={{ paddingTop: 80 }}>
            <div className="kepala-seksi">
              <span className="label">Kursus gratis</span>
              <Link href="/belajar" className="label tautan-lihat">
                Semua kursus →
              </Link>
            </div>
            <div className="kartu-kursus-kisi">
              {katalog.slice(0, 4).map((k) => (
                <KartuKursus key={k.id} kursus={k} />
              ))}
            </div>
          </section>
        )}

        <section className="halaman seksi" style={{ paddingTop: 80 }}>
          <span className="kicker">Cara kami menulis</span>
          <h2 className="judul-seksi" style={{ marginTop: 16, maxWidth: 720 }}>
            Setiap tulisan harus lolos tiga pertanyaan sebelum terbit.
          </h2>
          <div className="saringan-kisi">
            {SARINGAN.map((s, i) => (
              <div key={s} className="saringan">
                <span className="saringan-angka">{i + 1}</span>
                <p>{s}</p>
              </div>
            ))}
          </div>
          <Link
            href="/tentang"
            className="label tautan-lihat"
            style={{ display: 'inline-block', marginTop: 32 }}
          >
            Baca janji editorial kami →
          </Link>
        </section>

        <section className="ajakan-bara">
          <div className="halaman ajakan-bara-isi">
            <div>
              <TandaLogo ukuran={44} />
              <h2 style={{ marginTop: 22 }}>Satu catatan setiap Senin pagi, sebelum toko buka.</h2>
              <p className="sub">
                Gratis, tanpa iklan, tanpa tautan afiliasi. Berhenti kapan saja lewat tautan di
                bawah setiap email.
              </p>
            </div>
            <FormLangganan
              sumber="beranda"
              tombol="Daftar gratis"
              catatan="Kami tidak pernah membagikan alamat emailmu."
            />
          </div>
        </section>
      </main>

      <Kaki />
    </>
  );
}
