import Link from 'next/link';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import { ambilTerbit } from '@/lib/tulisan';
import { penanda, tanggalPanjang, TOPIK, SERI_CERITA } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Baca',
  description: 'Semua tulisan belummenyerah tentang uang usaha, terbaru dulu.',
};

export default async function HalamanBaca() {
  const daftar = await ambilTerbit(200);

  return (
    <>
      <Masthead aktif="baca" />

      <main id="isi" className="halaman utama">
        <span className="kicker">Baca</span>
        <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 800 }}>
          Semua tulisan, terbaru dulu.
        </h1>
        <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
          {daftar.length > 0
            ? `${daftar.length} tulisan. Pilih topik di bawah kalau kamu sedang mencari sesuatu yang spesifik.`
            : 'Belum ada yang terbit. Catatan pertama sedang ditulis.'}
        </p>

        <nav className="saringan" aria-label="Saringan topik">
          <span className="saringan-tautan saringan-aktif" aria-current="page">
            Semua
          </span>
          {TOPIK.map((t) => (
            <Link key={t.kode} href={`/topik/${t.kode}`} className="saringan-tautan">
              {t.nama}
            </Link>
          ))}
          <Link href="/cerita" className="saringan-tautan">
            {SERI_CERITA.nama}
          </Link>
        </nav>

        <div style={{ marginTop: 44 }}>
          {daftar.map((t) => (
            <article key={t.id} className="baris-arsip">
              <div className="waktu">
                <span className="meta">{tanggalPanjang(t.terbit_pada)}</span>
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
                  {penanda(t.format, t.topik, t.nomor)} · {t.menit_baca} menit
                </span>
              </div>
            </article>
          ))}
        </div>
      </main>

      <Kaki />
    </>
  );
}
