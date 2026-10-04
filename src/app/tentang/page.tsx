import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import { Warung } from '@/components/Ilustrasi';
import FormLangganan from '@/components/FormLangganan';
import { TandaLogo } from '@/components/Logo';
import { SARINGAN } from '@/lib/redaksi';

export const metadata: Metadata = {
  title: 'Tentang',
  description:
    'Kenapa belummenyerah ada, untuk siapa kami menulis, dan aturan yang kami pakai sebelum menerbitkan tulisan.',
};

export default function HalamanTentang() {
  return (
    <>
      <Masthead aktif="tentang" />

      <main id="isi">
        <div className="halaman utama">
          <div className="kepala-ilustrasi">
            <div>
              <span className="kicker">Tentang</span>
              <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 820 }}>
                Usaha kecil jarang tutup karena pemiliknya kurang semangat.
              </h1>
            </div>
            <Warung ukuran={240} />
          </div>

          <article className="tulisan prosa" style={{ marginTop: 44 }}>
            <p>
              Lebih sering, usaha tutup karena tidak ada yang pernah menjelaskan angkanya secara
              jujur, dan karena bulan-bulan sepi itu dilewati sendirian.
            </p>
            <p>
              belummenyerah dibuat untuk dua masalah tersebut. Kami menjelaskan angka usaha dengan
              bahasa yang bisa dipahami siapa saja, dan kami menulis supaya pembaca tahu bahwa masa
              sulit itu tidak hanya dialami olehnya.
            </p>

            <h2>Untuk siapa kami menulis</h2>
            <p>
              Kami menulis untuk pemilik usaha yang baru berjalan satu sampai tiga tahun. Kami
              menulis untuk orang yang usahanya sedang menurun dan mulai berpikir untuk berhenti.
              Kami juga menulis untuk orang yang sedang merintis usaha sambil tetap bekerja di
              tempat lain.
            </p>
            <p>Kami tidak menulis untuk investor atau konsultan.</p>

            <h2>Yang tidak kami lakukan</h2>
            <p>
              Kami bukan media motivasi. Semangat tanpa angka justru berbahaya, karena membuat orang
              bertahan pada usaha yang sebenarnya sudah perlu diperbaiki.
            </p>
            <p>
              Kami juga bukan panduan cepat kaya, sebab tidak ada yang cepat dalam mengurus usaha.
              Kami bukan media berita, karena tulisan kami harus tetap berguna tahun depan. Dan kami
              bukan tempat untuk memamerkan hasil.
            </p>

            <h2>Janji editorial</h2>
            <p>
              Kami tidak pernah menyamarkan artikel berbayar sebagai tulisan biasa. Kalau sebuah
              tulisan disponsori, keterangannya kami cantumkan di bagian atas halaman, bukan
              disembunyikan di bagian bawah.
            </p>
          </article>
        </div>

        <section className="pita-gelap" style={{ marginTop: 80 }}>
          <div className="halaman">
            <span className="kicker">Tiga saringan sebelum terbit</span>
            <h2 className="pita-gelap-judul" style={{ marginTop: 18 }}>
              Setiap tulisan harus lolos tiga pertanyaan ini sebelum kami terbitkan.
            </h2>
            <div className="saringan-kisi" style={{ marginTop: 48 }}>
              {SARINGAN.map((teks, i) => (
                <div key={teks} className="saringan">
                  <span className="saringan-angka">{i + 1}</span>
                  <p>{teks}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ajakan-bara" style={{ marginTop: 0 }}>
          <div className="halaman ajakan-bara-isi">
            <div>
              <TandaLogo ukuran={44} />
              <h2 style={{ marginTop: 22 }}>Satu catatan setiap Senin pagi.</h2>
              <p className="sub">Gratis, tanpa iklan. Berhenti kapan saja.</p>
            </div>
            <FormLangganan sumber="tentang" />
          </div>
        </section>
      </main>

      <Kaki />
    </>
  );
}
