import Link from 'next/link';
import { NAMA_FORMAT, tanggalPanjang } from '@/lib/format';
import type { TulisanRingkas } from '@/lib/tulisan';
import type { FormatTulisan } from '@/lib/types';

/** Label format dengan warnanya sendiri, supaya jenis tulisan terbaca sekilas. */
export function LencanaFormat({ format }: { format: FormatTulisan }) {
  return <span className={`lencana-format format-${format}`}>{NAMA_FORMAT[format]}</span>;
}

export function nomorSeri(nomor: number | null) {
  return nomor ? `№${String(nomor).padStart(3, '0')}` : '';
}

export default function KartuTulisan({
  tulisan,
  utama = false,
}: {
  tulisan: TulisanRingkas;
  utama?: boolean;
}) {
  return (
    <article className={`kartu-tulisan format-${tulisan.format}${utama ? ' utama' : ''}`}>
      <div className="kartu-tulisan-kepala">
        <LencanaFormat format={tulisan.format} />
        {tulisan.nomor && <span className="kartu-nomor">{nomorSeri(tulisan.nomor)}</span>}
      </div>
      <h3 className="kartu-tulisan-judul">
        <Link href={`/blog/${tulisan.slug}`}>{tulisan.judul}</Link>
      </h3>
      {tulisan.deck && <p className="kartu-tulisan-deck">{tulisan.deck}</p>}
      <span className="kartu-tulisan-meta">
        {tanggalPanjang(tulisan.terbit_pada)} · {tulisan.menit_baca} menit baca
      </span>
    </article>
  );
}
