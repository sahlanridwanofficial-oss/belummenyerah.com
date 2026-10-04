import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import { TandaLogo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Berlangganan',
  description: 'Satu catatan setiap Senin pagi tentang uang usaha. Gratis, berhenti kapan saja.',
};

const ISI = [
  { hari: 'Senin', apa: 'Satu tulisan utama tentang kas, harga, atau utang.' },
  { hari: 'Kamis', apa: 'Panduan singkat atau cerita pemilik usaha yang pernah hampir berhenti.' },
  { hari: 'Selalu', apa: 'Tanpa iklan dan tanpa tautan afiliasi. Balas emailnya, kami baca.' },
];

export default function HalamanBerlangganan() {
  return (
    <>
      <Masthead />

      <main id="isi">
        <section className="pita-gelap" style={{ paddingBlock: 88 }}>
          <div className="halaman dua-kolom">
            <div className="kiri">
              <TandaLogo ukuran={52} />

              <h1 className="judul-raksasa" style={{ marginTop: 32, maxWidth: 620 }}>
                Bulan ini berat. Bulan depan belum tentu.
              </h1>

              <p
                style={{
                  marginTop: 20,
                  fontSize: 19,
                  lineHeight: 1.6,
                  color: 'var(--arang-lembut)',
                  maxWidth: 560,
                }}
              >
                Satu catatan setiap Senin pagi tentang uang usaha, ditulis supaya bisa dibaca
                sebelum toko buka. Praktis soal angka, jujur soal rasanya.
              </p>

              <div style={{ marginTop: 34, maxWidth: 520 }}>
                <FormLangganan
                  sumber="halaman-berlangganan"
                  tombol="Kirim ke email saya"
                  catatan="Gratis. Berhenti kapan saja lewat tautan di bawah setiap email."
                />
              </div>
            </div>

            <div className="kanan">
              <span className="label" style={{ paddingBottom: 6 }}>
                Isi langganan
              </span>
              <div className="daftar-isi-langganan">
                {ISI.map((i) => (
                  <div key={i.hari}>
                    <span className="hari">{i.hari}</span>
                    <span>{i.apa}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Kaki />
    </>
  );
}
