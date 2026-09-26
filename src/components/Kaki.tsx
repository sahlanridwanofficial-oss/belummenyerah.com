import Link from 'next/link';
import GarisBelum from './GarisBelum';
import { JALUR } from '@/lib/format';

export default function Kaki() {
  return (
    <footer className="halaman kaki">
      <div className="kolom" style={{ flex: '1 1 260px' }}>
        <span className="wordmark">belummenyerah</span>
        <div style={{ width: 240, marginBlock: 6 }}>
          <GarisBelum />
        </div>
        <span className="keterangan">
          Media bisnis kecil dan keuangan. Terbit dari Indonesia.
        </span>
      </div>

      <div className="kolom">
        <span className="label">Jalur</span>
        {JALUR.map((j) => (
          <Link key={j.kode} href={`/${j.kode}`}>
            {j.nama}
          </Link>
        ))}
      </div>

      <div className="kolom">
        <span className="label">Tentang</span>
        <Link href="/kursus">Kursus</Link>
        <Link href="/tentang">Siapa kami</Link>
        <Link href="/arsip">Arsip lengkap</Link>
        <Link href="/berlangganan">Berlangganan</Link>
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
