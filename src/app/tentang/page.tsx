import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';

export const metadata: Metadata = {
  title: 'Tentang',
  description:
    'Kenapa belummenyerah ada, untuk siapa kami menulis, dan aturan yang kami pakai sebelum menerbitkan tulisan.',
};

const SARINGAN = [
  'Apakah tulisan ini masih berguna tahun depan? Kalau tidak, kami tidak menerbitkannya.',
  'Apakah ada satu angka yang bisa langsung dihitung sendiri oleh pembaca?',
  'Apakah kami berani mengirimkannya kepada orang yang usahanya sedang bangkrut?',
];

export default function HalamanTentang() {
  return (
    <>
      <Masthead aktif="tentang" />

      <main id="isi" className="halaman utama">
        <span className="kicker">Tentang</span>
        <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 880 }}>
          Usaha kecil jarang tutup karena pemiliknya kurang semangat.
        </h1>

        <article className="tulisan prosa" style={{ marginTop: 44 }}>
          <p>
            Lebih sering, usaha tutup karena tidak ada yang pernah menjelaskan angkanya
            secara jujur, dan karena bulan-bulan sepi itu dilewati sendirian.
          </p>
          <p>
            belummenyerah dibuat untuk dua masalah tersebut. Kami menjelaskan angka usaha
            dengan bahasa yang bisa dipahami siapa saja, dan kami menulis supaya pembaca tahu
            bahwa masa sulit itu tidak hanya dialami olehnya.
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
            Kami bukan media motivasi. Semangat tanpa angka justru berbahaya, karena membuat
            orang bertahan pada usaha yang sebenarnya sudah perlu diperbaiki.
          </p>
          <p>
            Kami juga bukan panduan cepat kaya, sebab tidak ada yang cepat dalam mengurus
            usaha. Kami bukan media berita, karena tulisan kami harus tetap berguna tahun
            depan. Dan kami bukan tempat untuk memamerkan hasil.
          </p>

          <h2>Tiga saringan sebelum terbit</h2>
          <p>Setiap tulisan harus lolos tiga pertanyaan ini sebelum kami terbitkan.</p>
          <ol>
            {SARINGAN.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <h2>Janji editorial</h2>
          <p>
            Kami tidak pernah menyamarkan artikel berbayar sebagai tulisan biasa. Kalau sebuah
            tulisan disponsori, keterangannya kami cantumkan di bagian atas halaman, bukan
            disembunyikan di bagian bawah.
          </p>
        </article>

        <div style={{ marginTop: 56 }}>
          <GarisBelum />
        </div>

        <div className="kotak-langganan" style={{ borderTop: 0, marginTop: 46 }}>
          <div>
            <p className="judul-seksi">Satu catatan setiap Senin pagi.</p>
            <p style={{ marginTop: 12, fontSize: 17, color: 'var(--tinta-lembut)' }}>
              Gratis, tanpa iklan. Berhenti kapan saja.
            </p>
          </div>
          <FormLangganan sumber="tentang" />
        </div>
      </main>

      <Kaki />
    </>
  );
}
