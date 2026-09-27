import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import PemutarVideo from '@/components/PemutarVideo';
import TandaiSelesai from '@/components/TandaiSelesai';
import { ambilKursus, ratakan } from '@/lib/kursus';
import { keHtml, keTeks } from '@/lib/markdown';

type Props = { params: Promise<{ slug: string; pelajaran: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, pelajaran } = await params;
  const kursus = await ambilKursus(slug);
  const isi = kursus ? ratakan(kursus).find((p) => p.slug === pelajaran) : null;
  if (!kursus || !isi) return { title: 'Pelajaran tidak ditemukan' };

  return {
    title: `${isi.judul} · ${kursus.judul}`,
    description: isi.ringkas || keTeks(isi.isi, 160),
  };
}

export default async function HalamanPelajaran({ params }: Props) {
  const { slug, pelajaran: slugPelajaran } = await params;
  const kursus = await ambilKursus(slug);
  if (!kursus) notFound();

  const semua = ratakan(kursus);
  const urutan = semua.findIndex((p) => p.slug === slugPelajaran);
  if (urutan === -1) notFound();

  const ini = semua[urutan];
  const sebelumnya = urutan > 0 ? semua[urutan - 1] : null;
  const berikutnya = urutan < semua.length - 1 ? semua[urutan + 1] : null;
  const modulIni = kursus.modul.find((m) => m.id === ini.modul_id);

  return (
    <>
      <Masthead aktif="belajar" />

      <main id="isi" className="halaman pelajaran-tata">
        <aside className="pelajaran-samping">
          <Link href={`/belajar/${kursus.slug}`} className="label" style={{ paddingBottom: 10 }}>
            ← {kursus.judul}
          </Link>

          {kursus.modul.map((m, i) => (
            <div key={m.id} style={{ marginTop: 18 }}>
              <span className="label" style={{ paddingBottom: 8 }}>
                {String(i + 1).padStart(2, '0')} · {m.judul}
              </span>
              {m.pelajaran.map((p) => (
                <Link
                  key={p.id}
                  href={`/belajar/${kursus.slug}/${p.slug}`}
                  className="samping-tautan"
                  aria-current={p.slug === ini.slug ? 'page' : undefined}
                >
                  {p.judul}
                </Link>
              ))}
            </div>
          ))}
        </aside>

        <article className="pelajaran-isi">
          <span className="kicker">
            {modulIni ? modulIni.judul : kursus.judul} · Pelajaran {urutan + 1} dari {semua.length}
          </span>

          <h1 className="judul-artikel" style={{ marginTop: 16 }}>
            {ini.judul}
          </h1>

          {ini.ringkas && (
            <p className="deck" style={{ marginTop: 18 }}>
              {ini.ringkas}
            </p>
          )}

          {ini.video_url && (
            <div style={{ marginTop: 32 }}>
              <PemutarVideo url={ini.video_url} judul={ini.judul} />
            </div>
          )}

          {ini.isi.trim() ? (
            <div
              className="prosa"
              style={{ marginTop: 32 }}
              dangerouslySetInnerHTML={{ __html: keHtml(ini.isi) }}
            />
          ) : (
            !ini.video_url && (
              <div className="kosong" style={{ marginTop: 32 }}>
                <span className="label">Pelajaran masih kosong</span>
                <p style={{ marginTop: 10, color: 'var(--tinta-lembut)' }}>
                  Materinya belum ditulis.
                </p>
              </div>
            )
          )}

          <div className="pelajaran-kaki">
            <TandaiSelesai kursusSlug={kursus.slug} pelajaranSlug={ini.slug} />
            <div className="pelajaran-navigasi">
              {sebelumnya ? (
                <Link href={`/belajar/${kursus.slug}/${sebelumnya.slug}`} className="nav-kotak">
                  <span className="label">Sebelumnya</span>
                  <span className="nav-judul">{sebelumnya.judul}</span>
                </Link>
              ) : (
                <span />
              )}
              {berikutnya ? (
                <Link
                  href={`/belajar/${kursus.slug}/${berikutnya.slug}`}
                  className="nav-kotak nav-kanan"
                >
                  <span className="label">Berikutnya</span>
                  <span className="nav-judul">{berikutnya.judul}</span>
                </Link>
              ) : (
                <Link href={`/belajar/${kursus.slug}`} className="nav-kotak nav-kanan">
                  <span className="label">Selesai</span>
                  <span className="nav-judul">Kembali ke halaman kursus</span>
                </Link>
              )}
            </div>
          </div>
        </article>
      </main>

      <Kaki />
    </>
  );
}
