import Link from 'next/link';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import { ambilTerbit } from '@/lib/tulisan';
import { penanda, tanggalPanjang } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Semua tulisan belummenyerah tentang uang usaha, terbaru dulu.',
};

export default async function HalamanBlog() {
  const daftar = await ambilTerbit(200);

  return (
    <>
      <Masthead aktif="blog" />

      <main id="isi" className="halaman utama">
        <span className="kicker">Blog</span>
        <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 800 }}>
          Semua tulisan, terbaru dulu.
        </h1>
        <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
          {daftar.length > 0
            ? `${daftar.length} tulisan tentang kas, harga, utang, dan hal-hal yang biasanya tidak ada yang menjelaskan.`
            : 'Belum ada yang terbit. Catatan pertama sedang ditulis.'}
        </p>

        {daftar.length === 0 ? (
          <div className="kosong susun susun-16" style={{ marginTop: 44, maxWidth: 620 }}>
            <span className="label">Masih kosong</span>
            <p style={{ fontSize: 19, lineHeight: 1.6 }}>
              Tinggalkan emailmu, dan kamu termasuk yang pertama membacanya.
            </p>
            <div style={{ marginTop: 8 }}>
              <FormLangganan sumber="blog-kosong" tombol="Kabari saya" />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 48 }}>
            {daftar.map((t) => (
              <article key={t.id} className="baris-arsip">
                <div className="waktu">
                  <span className="meta">{tanggalPanjang(t.terbit_pada)}</span>
                </div>
                <div className="isi">
                  <Link href={`/blog/${t.slug}`} className="judul">
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
                    {penanda(t.format, t.nomor)} · {t.menit_baca} menit
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Kaki />
    </>
  );
}
