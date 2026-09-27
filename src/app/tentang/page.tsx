import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';

export const metadata: Metadata = {
  title: 'Tentang',
  description: 'Kenapa belummenyerah ada, untuk siapa, dan bagaimana kami menulis.',
};

const SARINGAN = [
  'Masih berguna tahun depan? Kalau tidak, tidak kami terbitkan.',
  'Ada satu angka yang bisa langsung dihitung sendiri oleh pembaca?',
  'Berani kami kirimkan ke orang yang usahanya sedang bangkrut?',
];

export default function HalamanTentang() {
  return (
    <>
      <Masthead aktif="tentang" />

      <main id="isi" className="halaman utama">
        <span className="kicker">Tentang</span>
        <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 880 }}>
          Kebanyakan usaha kecil tidak tutup karena pemiliknya kurang semangat.
        </h1>

        <article className="tulisan prosa" style={{ marginTop: 44 }}>
          <p>
            Mereka tutup karena tidak ada yang pernah menjelaskan angkanya dengan jujur, dan karena
            bulan-bulan sepi itu dilewati sendirian. belummenyerah dibuat untuk dua hal itu.
          </p>
          <p>
            Kami menulis untuk pemilik usaha di tahun pertama sampai ketiga, untuk orang yang
            usahanya sedang turun dan mulai menimbang untuk berhenti, dan untuk perintis yang masih
            bekerja di tempat lain. Bukan untuk investor, bukan untuk konsultan.
          </p>

          <h2>Yang kami bukan</h2>
          <p>
            Bukan media motivasi — semangat tanpa angka itu racun. Bukan panduan cepat kaya — tidak
            ada yang cepat di sini. Bukan media berita — tulisan kami harus tetap berguna tahun
            depan. Bukan panggung pamer hasil.
          </p>

          <h2>Tiga saringan sebelum terbit</h2>
          <ol>
            {SARINGAN.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <h2>Janji editorial</h2>
          <p>
            Tidak ada artikel berbayar yang disamarkan. Kalau ada sponsor, ditulis di atas — bukan
            di bawah.
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
