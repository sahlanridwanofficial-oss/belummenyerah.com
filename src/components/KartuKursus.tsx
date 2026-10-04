import Link from 'next/link';
import { Buku } from './Ilustrasi';
import { NAMA_TINGKAT, type KursusRingkas } from '@/lib/kursus';

export default function KartuKursus({ kursus }: { kursus: KursusRingkas }) {
  return (
    <article className="kartu-kursus">
      <Buku />
      <div className="kartu-kursus-isi">
        <span className="kartu-kursus-meta">
          <span>{NAMA_TINGKAT[kursus.tingkat]}</span>
          <span>{kursus.jumlah_pelajaran} pelajaran</span>
          {kursus.total_menit > 0 && <span>{kursus.total_menit} menit</span>}
          <span>Gratis</span>
        </span>
        <h3 className="kartu-kursus-judul">
          <Link href={`/belajar/${kursus.slug}`}>{kursus.judul}</Link>
        </h3>
        {kursus.deck && <p className="kartu-kursus-deck">{kursus.deck}</p>}
        <span className="kartu-kursus-mulai">Mulai belajar →</span>
      </div>
    </article>
  );
}
