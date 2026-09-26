import Link from 'next/link';

/** Bagian situs yang sedang dibuka, untuk menandai menu aktif. */
export type Bagian = 'baca' | 'belajar' | 'tentang';

/**
 * Menu dibagi menurut niat pembaca, bukan menurut topik:
 * "Baca" untuk yang mencari jawaban cepat, "Belajar" untuk yang mau
 * materi berurutan. Topik jadi saringan di dalam halaman Baca.
 */
export default function Masthead({ aktif }: { aktif?: Bagian }) {
  return (
    <header className="masthead">
      <div className="halaman masthead-isi">
        <Link href="/" className="wordmark">
          belummenyerah
        </Link>
        <nav className="nav" aria-label="Menu utama">
          <Link href="/baca" aria-current={aktif === 'baca' ? 'page' : undefined}>
            Baca
          </Link>
          <Link href="/belajar" aria-current={aktif === 'belajar' ? 'page' : undefined}>
            Belajar
          </Link>
          <Link href="/tentang" aria-current={aktif === 'tentang' ? 'page' : undefined}>
            Tentang
          </Link>
          <Link href="/berlangganan" className="tombol tombol-kecil">
            Berlangganan
          </Link>
        </nav>
      </div>
    </header>
  );
}
