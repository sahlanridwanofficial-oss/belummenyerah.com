import Link from 'next/link';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import { ambilTerbit } from '@/lib/tulisan';
import { penanda, tanggalPanjang } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Arsip',
  description: 'Semua tulisan belummenyerah, terbaru dulu.',
};

export default async function HalamanArsip() {
  const daftar = await ambilTerbit(200);

  return (
    <>
      <Masthead />

      <main id="isi" className="halaman utama">
        <span className="kicker">Arsip</span>
        <h1 className="judul-raksasa" style={{ marginTop: 18 }}>
          Semua tulisan
        </h1>
        <p className="deck" style={{ marginTop: 20, maxWidth: 620 }}>
          {daftar.length > 0
            ? `${daftar.length} tulisan, terbaru dulu.`
            : 'Belum ada yang terbit. Catatan pertama sedang ditulis.'}
        </p>

        <div style={{ marginTop: 52 }}>
          {daftar.map((t) => (
            <article key={t.id} className="baris-arsip">
              <div className="waktu">
                <span className="meta">{tanggalPanjang(t.terbit_pada)}</span>
              </div>
              <div className="isi">
                <Link href={`/catatan/${t.slug}`} className="judul">
                  {t.judul}
                </Link>
                <span className="meta" style={{ display: 'block', marginTop: 10 }}>
                  {penanda(t.format, t.jalur, t.nomor)} · {t.menit_baca} menit
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
