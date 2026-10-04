import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import KartuKursus from '@/components/KartuKursus';
import { Buku } from '@/components/Ilustrasi';
import { ambilKatalogRingkas } from '@/lib/kursus';

export const metadata: Metadata = {
  title: 'Kursus',
  description:
    'Kursus gratis tentang uang usaha: kas, harga, margin, dan cara memisahkan dompet pribadi dari dompet usaha.',
};

const CARA_KERJA = [
  { hari: 'Pendek', apa: 'Setiap kursus dibagi menjadi modul dan pelajaran pendek.' },
  { hari: 'Bebas', apa: 'Setiap pelajaran berupa tulisan, video, atau keduanya.' },
  {
    hari: 'Tanpa akun',
    apa: 'Kemajuanmu tersimpan di perangkat ini, jadi tidak perlu masuk akun.',
  },
];

export default async function HalamanKursus() {
  const katalog = await ambilKatalogRingkas();

  return (
    <>
      <Masthead aktif="belajar" />

      <main id="isi">
        <div className="halaman utama">
          <div className="kepala-ilustrasi">
            <div>
              <span className="kicker">Kursus</span>
              <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 760 }}>
                Belajar mengurus uang usaha, selangkah demi selangkah.
              </h1>
              <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
                Semua kursus gratis, tanpa akun dan tanpa biaya. Mulai dari mana saja, berhenti
                kapan saja, dan lanjutkan lagi saat sempat.
              </p>
            </div>
            <Buku ukuran={200} />
          </div>
        </div>

        <section className="pita-jadwal" style={{ marginTop: 56 }} aria-label="Cara kerjanya">
          <div className="halaman pita-jadwal-isi">
            {CARA_KERJA.map((c) => (
              <div key={c.hari}>
                <span className="hari">{c.hari}</span>
                <span className="apa">{c.apa}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="halaman" style={{ paddingTop: 56 }}>
          {katalog.length === 0 ? (
            <div className="kosong kosong-ilustrasi">
              <Buku ukuran={150} />
              <div className="susun susun-16">
                <span className="label">Belum ada kursus</span>
                <p className="judul-seksi" style={{ fontSize: 30 }}>
                  Kursus pertama sedang disusun.
                </p>
                <p style={{ color: 'var(--tinta-lembut)', maxWidth: 560 }}>
                  Tinggalkan alamat emailmu. Kami kabari begitu kursus pertama dibuka.
                </p>
                <div style={{ maxWidth: 480, marginTop: 8 }}>
                  <FormLangganan sumber="kursus-kosong" tombol="Kabari saya" />
                </div>
              </div>
            </div>
          ) : (
            <div className="kartu-kursus-kisi" style={{ marginTop: 0 }}>
              {katalog.map((k) => (
                <KartuKursus key={k.id} kursus={k} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Kaki />
    </>
  );
}
