import Link from 'next/link';
import GarisBelum from './GarisBelum';
import { TOPIK } from '@/lib/format';

export default function Kaki() {
  return (
    <footer className="halaman kaki">
      <div className="kolom" style={{ flex: '1 1 260px' }}>
        <span className="wordmark">belummenyerah</span>
        <div style={{ width: 240, marginBlock: 6 }}>
          <GarisBelum />
        </div>
        <span className="keterangan">
          Media bisnis kecil dan keuangan. Dibuat di Indonesia.
        </span>
      </div>

      <div className="kolom">
        <span className="label">Jelajahi</span>
        <Link href="/baca">Baca</Link>
        <Link href="/belajar">Belajar</Link>
        <Link href="/cerita">Cerita</Link>
        <Link href="/tentang">Tentang</Link>
      </div>

      <div className="kolom">
        <span className="label">Topik</span>
        {TOPIK.map((t) => (
          <Link key={t.kode} href={`/topik/${t.kode}`}>
            {t.nama}
          </Link>
        ))}
      </div>

      <div className="kolom">
        <span className="label">Dibuat dengan</span>
        <span className="keterangan">
          Instrument Serif, Newsreader, dan Instrument Sans. Tanpa pelacak pihak ketiga.
        </span>
      </div>
    </footer>
  );
}
