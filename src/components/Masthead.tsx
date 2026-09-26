import Link from 'next/link';
import { JALUR } from '@/lib/format';
import type { Jalur } from '@/lib/types';

export default function Masthead({ aktif }: { aktif?: Jalur | 'kursus' }) {
  return (
    <header className="masthead">
      <div className="halaman masthead-isi">
        <Link href="/" className="wordmark">
          belummenyerah
        </Link>
        <nav className="nav" aria-label="Menu utama">
          <Link href="/kursus" aria-current={aktif === 'kursus' ? 'page' : undefined}>
            Kursus
          </Link>
          {JALUR.map((j) => (
            <Link
              key={j.kode}
              href={`/${j.kode}`}
              aria-current={aktif === j.kode ? 'page' : undefined}
            >
              {j.nama}
            </Link>
          ))}
          <Link href="/berlangganan" className="tombol tombol-kecil">
            Berlangganan
          </Link>
        </nav>
      </div>
    </header>
  );
}
