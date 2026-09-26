import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import { ambilTerbit } from '@/lib/tulisan';
import { penanda, tanggalPanjang, TOPIK, SERI_CERITA } from '@/lib/format';

type Props = { params: Promise<{ kode: string }> };

export function generateStaticParams() {
  return TOPIK.map((t) => ({ kode: t.kode }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kode } = await params;
  const topik = TOPIK.find((t) => t.kode === kode);
  if (!topik) return { title: 'Tidak ditemukan' };
  return { title: topik.nama, description: topik.ringkas };
}

export default async function HalamanTopik({ params }: Props) {
  const { kode } = await params;
  const topik = TOPIK.find((t) => t.kode === kode);
  if (!topik) notFound();

  const daftar = await ambilTerbit(60, topik.kode);

  return (
    <>
      <Masthead aktif="baca" />

      <main id="isi" className="halaman utama">
        <div className="dua-kolom">
          <div className="kiri">
            <span className="kicker">Topik</span>
            <h1 className="judul-raksasa" style={{ marginTop: 18 }}>
              {topik.nama}
            </h1>
            <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
              {topik.ringkas}
            </p>
          </div>
          <div className="kanan">
            <span className="label" style={{ paddingBottom: 12 }}>
              Pertanyaan yang dijawab di sini
            </span>
            <p style={{ fontSize: 19, lineHeight: 1.55, fontStyle: 'italic' }}>
              “{topik.pertanyaan}”
            </p>
          </div>
        </div>

        <nav className="saringan" aria-label="Saringan topik">
          <Link href="/baca" className="saringan-tautan">
            Semua
          </Link>
          {TOPIK.map((t) => (
            <Link
              key={t.kode}
              href={`/topik/${t.kode}`}
              className={
                t.kode === topik.kode ? 'saringan-tautan saringan-aktif' : 'saringan-tautan'
              }
              aria-current={t.kode === topik.kode ? 'page' : undefined}
            >
              {t.nama}
            </Link>
          ))}
          <Link href="/cerita" className="saringan-tautan">
            {SERI_CERITA.nama}
          </Link>
        </nav>

        <div style={{ marginTop: 44 }}>
          {daftar.length === 0 ? (
            <div className="kosong susun susun-16">
              <span className="label">Masih kosong</span>
              <p className="judul-seksi" style={{ fontSize: 30 }}>
                Belum ada tulisan di topik ini.
              </p>
              <div style={{ maxWidth: 460, marginTop: 8 }}>
                <FormLangganan sumber={`topik:${topik.kode}`} tombol="Kabari saya" />
              </div>
            </div>
          ) : (
            daftar.map((t) => (
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
            ))
          )}
        </div>
      </main>

      <Kaki />
    </>
  );
}
