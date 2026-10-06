import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import { ambilTerbit } from '@/lib/tulisan';
import KartuTulisan, { LencanaFormat } from '@/components/KartuTulisan';
import { Warung } from '@/components/Ilustrasi';
import { NAMA_FORMAT } from '@/lib/format';
import type { FormatTulisan } from '@/lib/types';
import { requirePublicArticles } from './_visibility';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Semua tulisan belummenyerah tentang uang usaha, terbaru dulu.',
  robots: { index: false, follow: false },
};

export default async function HalamanBlog() {
  requirePublicArticles();
  const daftar = await ambilTerbit(200);

  return (
    <>
      <Masthead aktif="blog" ajakan={false} />

      <main id="isi" className="halaman utama">
        <span className="kicker">Blog</span>
        <h1 className="judul-raksasa" style={{ marginTop: 18, maxWidth: 800 }}>
          Semua tulisan, terbaru dulu.
        </h1>
        <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
          {daftar.length > 0
            ? `${daftar.length} tulisan tentang kas, harga, dan utang. Hal-hal yang jarang dijelaskan dengan terbuka.`
            : 'Belum ada tulisan yang terbit. Catatan pertama sedang disiapkan.'}
        </p>

        {daftar.length === 0 ? (
          <div className="kosong kosong-ilustrasi" style={{ marginTop: 44 }}>
            <Warung ukuran={180} />
            <div className="susun susun-16">
              <span className="label">Masih kosong</span>
              <p style={{ fontSize: 19, lineHeight: 1.6 }}>
                Tinggalkan alamat emailmu, dan kamu jadi salah satu pembaca pertama.
              </p>
              <div style={{ marginTop: 8, maxWidth: 480 }}>
                <FormLangganan sumber="blog-kosong" tombol="Kabari saya" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="legenda-format" aria-label="Jenis tulisan">
              {(Object.keys(NAMA_FORMAT) as FormatTulisan[]).map((f) => (
                <LencanaFormat key={f} format={f} />
              ))}
            </div>
            <div className="kartu-tulisan-kisi" style={{ marginTop: 40 }}>
              {daftar.map((t, i) => (
                <KartuTulisan key={t.id} tulisan={t} utama={i === 0} />
              ))}
            </div>
          </>
        )}
      </main>

      <Kaki />
    </>
  );
}
