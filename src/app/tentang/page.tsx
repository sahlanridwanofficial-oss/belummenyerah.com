import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';
import { TOPIK } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Tentang',
  description: 'Kenapa belummenyerah ada, untuk siapa, dan bagaimana kami menulis.',
};

const SARINGAN = [
  'Masih berguna tahun depan? Kalau tidak, tidak kami terbitkan.',
  'Ada satu angka yang bisa dihitung sendiri oleh pembaca?',
  'Beranikah kami mengirimkannya ke orang yang usahanya sedang bangkrut?',
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

        <div className="artikel" style={{ paddingTop: 44 }}>
          <div className="pinggir" aria-hidden="true" />
          <div className="badan prosa">
            <p>
              Mereka tutup karena tidak ada yang pernah menjelaskan angkanya dengan jujur, dan
              karena bulan-bulan sepi itu dilewati sendirian. belummenyerah dibuat untuk dua hal
              itu.
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

            <h2>Cerita</h2>
            <p>
              Di luar tiga topik itu ada satu seri: <strong>Hampir Nyerah</strong> — wawancara
              panjang dengan pemilik usaha yang pernah berada di titik mau berhenti. Cerita bukan
              topik, melainkan bentuk tulisan, jadi tiap wawancara tetap masuk topik sesuai isinya.
            </p>

            <h2>Janji editorial</h2>
            <p>
              Tidak ada artikel berbayar yang disamarkan. Kalau ada sponsor, ditulis di atas — bukan
              di bawah.
            </p>
          </div>

          <aside className="samping">
            <span className="label" style={{ paddingBottom: 12 }}>
              Tiga topik
            </span>
            <div className="susun">
              {TOPIK.map((j) => (
                <span
                  key={j.kode}
                  style={{
                    padding: '12px 0',
                    borderTop: '1px solid var(--garis)',
                    fontSize: 16,
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ fontWeight: 600 }}>{j.nama}</strong>
                  <br />
                  <span style={{ color: 'var(--meta)', fontSize: 15 }}>{j.ringkas}</span>
                </span>
              ))}
            </div>
          </aside>
        </div>

        <div style={{ marginTop: 56 }}>
          <GarisBelum />
        </div>

        <div className="kotak-langganan" style={{ borderTop: 0, marginTop: 46 }}>
          <div>
            <p className="judul-seksi">Satu catatan setiap Senin pagi.</p>
            <p style={{ marginTop: 12, fontSize: 17, color: 'var(--tinta-lembut)' }}>
              Gratis. Berhenti kapan saja.
            </p>
          </div>
          <FormLangganan sumber="tentang" />
        </div>
      </main>

      <Kaki />
    </>
  );
}
