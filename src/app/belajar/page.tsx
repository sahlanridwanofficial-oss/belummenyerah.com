import Link from 'next/link';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import { ambilKatalogRingkas, NAMA_TINGKAT } from '@/lib/kursus';

export const metadata: Metadata = {
  title: 'Kursus',
  description:
    'Kursus gratis tentang uang usaha — kas, harga, margin, dan cara memisahkan dompet pribadi dari dompet usaha.',
};

export default async function HalamanKursus() {
  const katalog = await ambilKatalogRingkas();

  return (
    <>
      <Masthead aktif="belajar" />

      <main id="isi" className="halaman utama">
        <div className="dua-kolom">
          <div className="kiri">
            <span className="kicker">Kursus</span>
            <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 760 }}>
              Belajar mengurus uang usaha, selangkah demi selangkah.
            </h1>
            <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
              Semua kursus gratis, tanpa akun dan tanpa biaya. Mulai dari mana saja,
              berhenti kapan saja, dan lanjutkan lagi saat sempat.
            </p>
          </div>
          <div className="kanan">
            <span className="label" style={{ paddingBottom: 12 }}>
              Cara kerjanya
            </span>
            <div className="susun">
              <span className="baris-tipis">Setiap kursus dibagi menjadi modul dan pelajaran pendek.</span>
              <span className="baris-tipis">Setiap pelajaran berupa tulisan, video, atau keduanya.</span>
              <span className="baris-tipis" style={{ borderBottom: '1px solid var(--garis)' }}>
                Kemajuanmu tersimpan di perangkat ini, jadi kamu tidak perlu masuk akun.
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          {katalog.length === 0 ? (
            <div className="kosong susun susun-16">
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
          ) : (
            katalog.map((k) => (
              <article key={k.id} className="baris-arsip">
                <div className="waktu susun susun-8">
                  <span className="meta">{NAMA_TINGKAT[k.tingkat]}</span>
                  <span className="meta">
                    {k.jumlah_pelajaran} pelajaran
                    {k.total_menit > 0 ? ` · ${k.total_menit} menit` : ''}
                  </span>
                </div>
                <div className="isi">
                  <Link href={`/belajar/${k.slug}`} className="judul">
                    {k.judul}
                  </Link>
                  {k.deck && (
                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 17,
                        lineHeight: 1.55,
                        color: 'var(--tinta-lembut)',
                        maxWidth: 620,
                      }}
                    >
                      {k.deck}
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      <Kaki />
    </>
  );
}
