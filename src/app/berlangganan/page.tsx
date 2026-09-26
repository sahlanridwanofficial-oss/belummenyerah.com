import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';

export const metadata: Metadata = {
  title: 'Berlangganan',
  description: 'Satu catatan tiap Senin pagi tentang uang usaha — gratis, berhenti kapan saja.',
};

export default function HalamanBerlangganan() {
  return (
    <>
      <Masthead />

      <main id="isi">
        <section className="blok-arang" style={{ marginTop: 0, paddingBlock: 80 }}>
          <div className="halaman dua-kolom">
            <div className="kiri">
              <span className="wordmark">belummenyerah</span>
              <div style={{ width: 220, marginTop: 14 }}>
                <span style={{ color: 'var(--bara-terang)', display: 'block' }}>
                  <GarisBelum />
                </span>
              </div>

              <h1 className="judul-raksasa" style={{ marginTop: 44, maxWidth: 620 }}>
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
                Satu catatan tiap Senin pagi tentang uang usaha — ditulis untuk dibaca sebelum toko
                buka. Praktis soal angka, jujur soal rasanya.
              </p>

              <div style={{ marginTop: 34, maxWidth: 520 }}>
                <FormLangganan
                  sumber="halaman-berlangganan"
                  tombol="Kirimi saya catatannya"
                  catatan="Berhenti kapan saja lewat satu tautan di bawah setiap kiriman."
                />
              </div>
            </div>

            <div className="kanan">
              <span className="label" style={{ paddingBottom: 10 }}>
                Yang kamu terima
              </span>
              <div className="susun">
                <span
                  style={{
                    fontSize: 16,
                    lineHeight: 1.5,
                    padding: '12px 0',
                    borderTop: '1px solid var(--arang-garis)',
                  }}
                >
                  Senin — satu catatan panjang
                </span>
                <span
                  style={{
                    fontSize: 16,
                    lineHeight: 1.5,
                    padding: '12px 0',
                    borderTop: '1px solid var(--arang-garis)',
                  }}
                >
                  Kamis — Satu Halaman, Panduan, atau Wawancara
                </span>
                <span
                  style={{
                    fontSize: 16,
                    lineHeight: 1.5,
                    padding: '12px 0',
                    borderTop: '1px solid var(--arang-garis)',
                    borderBottom: '1px solid var(--arang-garis)',
                  }}
                >
                  Tidak ada iklan, tidak ada tautan afiliasi
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Kaki />
    </>
  );
}
