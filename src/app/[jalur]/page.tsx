import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import { ambilTerbit } from '@/lib/tulisan';
import { JALUR, penanda, tanggalPanjang } from '@/lib/format';
import type { Jalur } from '@/lib/types';

type Props = { params: Promise<{ jalur: string }> };

export function generateStaticParams() {
  return JALUR.map((j) => ({ jalur: j.kode }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jalur: kode } = await params;
  const jalur = JALUR.find((j) => j.kode === kode);
  if (!jalur) return { title: 'Tidak ditemukan' };
  return { title: jalur.nama, description: jalur.ringkas };
}

export default async function HalamanJalur({ params }: Props) {
  const { jalur: kode } = await params;
  const jalur = JALUR.find((j) => j.kode === kode);
  if (!jalur) notFound();

  const daftar = await ambilTerbit(60, jalur.kode as Jalur);

  return (
    <>
      <Masthead aktif={jalur.kode} />

      <main id="isi" className="halaman utama">
        <div className="dua-kolom">
          <div className="kiri">
            <span className="kicker">Jalur</span>
            <h1 className="judul-raksasa" style={{ marginTop: 18 }}>
              {jalur.nama}
            </h1>
            <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
              {jalur.ringkas}
            </p>
          </div>
          <div className="kanan">
            <span className="label" style={{ paddingBottom: 12 }}>
              Pertanyaan yang dijawab di sini
            </span>
            <p style={{ fontSize: 19, lineHeight: 1.55, fontStyle: 'italic' }}>
              “{jalur.pertanyaan}”
            </p>
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          {daftar.length === 0 ? (
            <div className="kosong tumpuk tumpuk-16">
              <span className="label">Masih kosong</span>
              <p className="judul-seksi" style={{ fontSize: 30 }}>
                Belum ada tulisan di jalur ini.
              </p>
              <div style={{ maxWidth: 460, marginTop: 8 }}>
                <FormLangganan sumber={`jalur:${jalur.kode}`} tombol="Beri tahu saya" />
              </div>
            </div>
          ) : (
            daftar.map((t) => (
              <article key={t.id} className="baris-arsip">
                <div className="waktu">
                  <span className="meta">{tanggalPanjang(t.terbit_pada)}</span>
                </div>
                <div className="isi">
                  <Link href={`/catatan/${t.slug}`} className="judul">
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
                    {penanda(t.format, t.jalur, t.nomor)} · {t.menit_baca} menit
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
