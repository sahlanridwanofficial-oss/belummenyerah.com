import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';
import KemajuanKursus from '@/components/KemajuanKursus';
import { ambilKursus, hitungMenit, ratakan, NAMA_TINGKAT } from '@/lib/kursus';
import { keHtml } from '@/lib/markdown';
import { NAMA_JALUR } from '@/lib/format';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const kursus = await ambilKursus(slug);
  if (!kursus) return { title: 'Kursus tidak ditemukan' };
  return {
    title: kursus.judul,
    description: kursus.deck,
    openGraph: { title: kursus.judul, description: kursus.deck, type: 'article' },
  };
}

export default async function HalamanKursusTunggal({ params }: Props) {
  const { slug } = await params;
  const kursus = await ambilKursus(slug);
  if (!kursus) notFound();

  const semua = ratakan(kursus);
  const menit = hitungMenit(kursus);
  const pertama = semua[0];

  return (
    <>
      <Masthead />

      <main id="isi" className="halaman utama">
        {kursus.status === 'draf' && (
          <div className="tanda-draf">Draf — hanya kamu yang bisa melihatnya</div>
        )}

        <div className="dua-kolom">
          <div className="kiri">
            <span className="kicker">
              Kursus · {NAMA_JALUR[kursus.jalur]} · {NAMA_TINGKAT[kursus.tingkat]}
            </span>
            <h1 className="judul-raksasa" style={{ marginTop: 18 }}>
              {kursus.judul}
            </h1>
            {kursus.deck && (
              <p className="deck" style={{ marginTop: 20, maxWidth: 640 }}>
                {kursus.deck}
              </p>
            )}

            <div
              style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, flexWrap: 'wrap' }}
            >
              <span className="meta">{kursus.modul.length} modul</span>
              <span className="titik" />
              <span className="meta">{semua.length} pelajaran</span>
              {menit > 0 && (
                <>
                  <span className="titik" />
                  <span className="meta">{menit} menit</span>
                </>
              )}
              <span className="titik" />
              <span className="meta">Gratis</span>
            </div>

            {pertama && (
              <div style={{ marginTop: 30 }}>
                <Link href={`/kursus/${kursus.slug}/${pertama.slug}`} className="tombol">
                  Mulai dari pelajaran pertama
                </Link>
              </div>
            )}

            <KemajuanKursus kursusSlug={kursus.slug} total={semua.length} />

            {kursus.ringkasan && (
              <div
                className="prosa"
                style={{ marginTop: 34, maxWidth: 620 }}
                dangerouslySetInnerHTML={{ __html: keHtml(kursus.ringkasan) }}
              />
            )}
          </div>

          <div className="kanan">
            {kursus.untuk_siapa ? (
              <>
                <span className="label" style={{ paddingBottom: 12 }}>
                  Untuk siapa
                </span>
                <div
                  className="prosa prosa-rapat"
                  dangerouslySetInnerHTML={{ __html: keHtml(kursus.untuk_siapa) }}
                />
              </>
            ) : (
              <>
                <span className="label" style={{ paddingBottom: 12 }}>
                  Disusun oleh
                </span>
                <span style={{ fontSize: 18 }}>{kursus.penulis}</span>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          <GarisBelum />
        </div>

        <section style={{ marginTop: 52 }}>
          <span className="label" style={{ paddingBottom: 20 }}>
            Isi kursus
          </span>

          {kursus.modul.length === 0 ? (
            <div className="kosong">
              <span className="label">Belum ada materi</span>
              <p style={{ marginTop: 10, color: 'var(--tinta-lembut)' }}>
                Modul dan pelajarannya belum disusun.
              </p>
            </div>
          ) : (
            kursus.modul.map((m, i) => (
              <div key={m.id} className="modul">
                <div className="modul-kepala">
                  <span className="modul-angka">{String(i + 1).padStart(2, '0')}</span>
                  <div className="susun susun-8">
                    <span className="modul-judul">{m.judul}</span>
                    {m.ringkas && (
                      <span style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--meta)' }}>
                        {m.ringkas}
                      </span>
                    )}
                  </div>
                </div>

                {m.pelajaran.length === 0 ? (
                  <span className="tautan-tulisan" style={{ color: 'var(--abu)' }}>
                    Belum ada pelajaran di modul ini.
                  </span>
                ) : (
                  m.pelajaran.map((p) => (
                    <Link
                      key={p.id}
                      href={`/kursus/${kursus.slug}/${p.slug}`}
                      className="baris-pelajaran"
                    >
                      <span className="nama">{p.judul}</span>
                      <span className="meta" style={{ whiteSpace: 'nowrap' }}>
                        {p.video_url ? 'Video' : 'Tulisan'}
                        {p.menit > 0 ? ` · ${p.menit} mnt` : ''}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            ))
          )}
        </section>

        <div className="kotak-langganan">
          <div>
            <p className="judul-seksi">Mau dikabari kalau ada materi baru?</p>
            <p style={{ marginTop: 12, fontSize: 17, color: 'var(--tinta-lembut)' }}>
              Daftar sekali, dan kamu akan dikabari tiap kursus ini bertambah — sekaligus dapat
              catatan mingguan kami. Materinya tetap bisa dibuka tanpa mendaftar.
            </p>
          </div>
          <FormLangganan
            sumber={`kursus:${kursus.slug}`}
            kursusSlug={kursus.status === 'terbit' ? kursus.slug : undefined}
            tombol="Daftar kursus ini"
            catatan="Gratis. Berhenti kapan saja."
            pesanBerhasil="Kamu terdaftar. Selamat belajar."
          />
        </div>
      </main>

      <Kaki />
    </>
  );
}
