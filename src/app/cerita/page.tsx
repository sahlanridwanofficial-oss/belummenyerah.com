import Link from 'next/link';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import { ambilWawancara } from '@/lib/tulisan';
import { NAMA_TOPIK, SERI_CERITA, tanggalPanjang } from '@/lib/format';

export const metadata: Metadata = {
  title: SERI_CERITA.nama,
  description: SERI_CERITA.ringkas,
};

export default async function HalamanCerita() {
  const daftar = await ambilWawancara();

  return (
    <>
      <Masthead aktif="baca" />

      <main id="isi">
        <section className="blok-arang" style={{ marginTop: 0, paddingBlock: 72 }}>
          <div className="halaman dua-kolom">
            <div className="kiri">
              <span className="kicker">Seri · {SERI_CERITA.judul}</span>
              <h1 className="judul-raksasa" style={{ marginTop: 20, maxWidth: 700 }}>
                {SERI_CERITA.ringkas}
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
                Satu wawancara panjang, tanpa dipoles. Kami menanyakan angkanya, bukan cuma
                perasaannya — bulan mana yang paling berat, apa yang dipotong lebih dulu, dan
                keputusan mana yang membuat mereka bertahan.
              </p>
            </div>
            <div className="kanan susun susun-16">
              <span className="label">Terbit dua minggu sekali</span>
              <span style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--arang-lembut)' }}>
                Cerita bukan topik, melainkan bentuk tulisan. Tiap wawancara tetap masuk topik
                sesuai isinya.
              </span>
            </div>
          </div>
        </section>

        <div className="halaman" style={{ paddingTop: 56 }}>
          {daftar.length === 0 ? (
            <div className="kosong susun susun-16">
              <span className="label">Belum ada wawancara</span>
              <p className="judul-seksi" style={{ fontSize: 30 }}>
                Wawancara pertama sedang disiapkan.
              </p>
              <p style={{ color: 'var(--tinta-lembut)', maxWidth: 560 }}>
                Tinggalkan emailmu, nanti kami kabari begitu episode pertamanya terbit.
              </p>
              <div style={{ maxWidth: 480, marginTop: 8 }}>
                <FormLangganan sumber="cerita" tombol="Kabari saya" />
              </div>
            </div>
          ) : (
            daftar.map((t) => (
              <article key={t.id} className="baris-arsip">
                <div className="waktu susun susun-8">
                  <span className="meta">{tanggalPanjang(t.terbit_pada)}</span>
                  <span className="meta">{NAMA_TOPIK[t.topik]}</span>
                </div>
                <div className="isi">
                  <Link href={`/baca/${t.slug}`} className="judul">
                    {t.judul}
                  </Link>
                  {t.deck && (
                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 17,
                        lineHeight: 1.55,
                        color: 'var(--tinta-lembut)',
                        maxWidth: 620,
                      }}
                    >
                      {t.deck}
                    </p>
                  )}
                  <span className="meta" style={{ display: 'block', marginTop: 12 }}>
                    {t.menit_baca} menit baca
                  </span>
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
