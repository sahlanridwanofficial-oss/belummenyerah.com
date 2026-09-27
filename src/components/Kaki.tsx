import Link from 'next/link';
import GarisBelum from './GarisBelum';

export default function Kaki() {
  return (
    <footer className="halaman kaki">
      <div className="kolom">
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
        <Link href="/blog">Blog</Link>
        <Link href="/belajar">Belajar</Link>
        <Link href="/tentang">Tentang</Link>
      </div>

      <div className="kolom">
        <span className="label">Berlangganan</span>
        <Link href="/berlangganan">Daftar email</Link>
        <span className="keterangan">Satu catatan setiap Senin pagi.</span>
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
