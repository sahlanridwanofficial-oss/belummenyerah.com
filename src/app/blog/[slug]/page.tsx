import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';
import { ambilSatu, ambilTetangga } from '@/lib/tulisan';
import { keHtml, keTeks } from '@/lib/markdown';
import { tanggalPanjang } from '@/lib/format';
import { LencanaFormat, nomorSeri } from '@/components/KartuTulisan';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tulisan = await ambilSatu(slug);
  if (!tulisan) return { title: 'Tulisan tidak ditemukan' };

  const ringkas = tulisan.deck || keTeks(tulisan.isi, 160);
  return {
    title: tulisan.judul,
    description: ringkas,
    openGraph: { title: tulisan.judul, description: ringkas, type: 'article' },
  };
}

export default async function HalamanTulisan({ params }: Props) {
  const { slug } = await params;
  const tulisan = await ambilSatu(slug);
  if (!tulisan) notFound();

  const berikutnya = await ambilTetangga(tulisan);
  const html = keHtml(tulisan.isi);

  return (
    <>
      <Masthead aktif="blog" ajakan={false} />

      <main id="isi" className="halaman halaman-tulisan">
        {tulisan.status === 'draf' && (
          <div className="tanda-draf">Draf. Hanya kamu yang bisa melihatnya</div>
        )}

        <article className="tulisan">
          <div className="kartu-tulisan-kepala" style={{ justifyContent: 'flex-start' }}>
            <LencanaFormat format={tulisan.format} />
            {tulisan.nomor && <span className="kartu-nomor">{nomorSeri(tulisan.nomor)}</span>}
          </div>
          <h1 className="judul-artikel" style={{ marginTop: 18 }}>
            {tulisan.judul}
          </h1>
          {tulisan.deck && (
            <p className="deck" style={{ marginTop: 20 }}>
              {tulisan.deck}
            </p>
          )}

          <div className="baris-byline">
            <span
              className="meta"
              style={{ color: 'var(--tinta)', fontWeight: 500, letterSpacing: '0.1em' }}
            >
              {tulisan.penulis}
            </span>
            <span className="gugus">
              <span className="meta">{tanggalPanjang(tulisan.terbit_pada)}</span>
              <span className="titik" />
              <span className="meta">{tulisan.menit_baca} menit baca</span>
            </span>
          </div>

          <div
            className="prosa"
            style={{ marginTop: 40 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <div style={{ marginTop: 56 }}>
          <GarisBelum />
        </div>

        <div className="kotak-langganan" style={{ marginTop: 46, borderTop: 0 }}>
          <div>
            {berikutnya ? (
              <>
                <span className="label">Tulisan sebelumnya</span>
                <Link
                  href={`/blog/${berikutnya.slug}`}
                  className="judul-seksi"
                  style={{ display: 'block', marginTop: 12, fontSize: 36 }}
                >
                  {berikutnya.judul}
                </Link>
                <span style={{ display: 'block', marginTop: 14 }}>
                  <LencanaFormat format={berikutnya.format} />
                </span>
              </>
            ) : (
              <>
                <span className="label">Blog</span>
                <Link
                  href="/blog"
                  className="judul-seksi"
                  style={{ display: 'block', marginTop: 12, fontSize: 36 }}
                >
                  Lihat semua tulisan →
                </Link>
              </>
            )}
          </div>

          <div className="sisi-kanan">
            <p className="judul-seksi" style={{ fontSize: 28, marginBottom: 14 }}>
              Dapatkan catatan berikutnya lewat email.
            </p>
            <FormLangganan sumber={`tulisan:${tulisan.slug}`} tombol="Daftar" />
          </div>
        </div>
      </main>

      <Kaki />
    </>
  );
}
