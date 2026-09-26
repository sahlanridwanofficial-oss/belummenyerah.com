import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';
import { ambilSatu, ambilTetangga } from '@/lib/tulisan';
import { keHtml, keTeks } from '@/lib/markdown';
import { TOPIK, penanda, tanggalPanjang } from '@/lib/format';

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

  const topik = TOPIK.find((j) => j.kode === tulisan.topik);
  const berikutnya = await ambilTetangga(tulisan);
  const html = keHtml(tulisan.isi);

  return (
    <>
      <Masthead aktif="baca" />

      <main id="isi" className="halaman">
        {tulisan.status === 'draf' && (
          <div
            style={{
              marginTop: 24,
              padding: '12px 16px',
              border: '1px solid var(--bara)',
              color: 'var(--bara)',
              fontFamily: 'var(--sans)',
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Draf — hanya kamu yang bisa melihatnya
          </div>
        )}

        <article className="artikel">
          <div className="pinggir" aria-hidden="true" />

          <div className="badan">
            <span className="kicker">{penanda(tulisan.format, tulisan.topik, tulisan.nomor)}</span>
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
              <span className="titik" />
              <span className="meta">{tanggalPanjang(tulisan.terbit_pada)}</span>
              <span className="titik" />
              <span className="meta">{tulisan.menit_baca} menit baca</span>
            </div>

            <div
              className="prosa"
              style={{ marginTop: 40 }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          <aside className="samping">
            {topik && (
              <div className="susun susun-8">
                <span className="label">Topik</span>
                <Link
                  href={`/${topik.kode}`}
                  className="nama-topik"
                  style={{ fontSize: 26, paddingTop: 4 }}
                >
                  {topik.nama}
                </Link>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--meta)' }}>
                  {topik.ringkas}
                </span>
              </div>
            )}
          </aside>
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
                  href={`/baca/${berikutnya.slug}`}
                  className="judul-seksi"
                  style={{ display: 'block', marginTop: 12, fontSize: 36 }}
                >
                  {berikutnya.judul}
                </Link>
                <span className="meta" style={{ display: 'block', marginTop: 14 }}>
                  {penanda(berikutnya.format, berikutnya.topik, berikutnya.nomor)}
                </span>
              </>
            ) : (
              <>
                <span className="label">Arsip</span>
                <Link
                  href="/baca"
                  className="judul-seksi"
                  style={{ display: 'block', marginTop: 12, fontSize: 36 }}
                >
                  Lihat semua tulisan →
                </Link>
              </>
            )}
          </div>

          <div style={{ borderLeft: '1px solid var(--garis)', paddingLeft: 60 }}>
            <p className="judul-seksi" style={{ fontSize: 28, marginBottom: 14 }}>
              Kirimi saya catatan setiap Senin.
            </p>
            <FormLangganan sumber={`artikel:${tulisan.slug}`} tombol="Kirim" />
          </div>
        </div>
      </main>

      <Kaki />
    </>
  );
}
