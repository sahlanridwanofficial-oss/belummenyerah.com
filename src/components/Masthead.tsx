import Link from 'next/link';
import Logo from './Logo';

export type Bagian = 'blog' | 'belajar' | 'tentang';

/**
 * `ajakan` menampilkan tombol langganan di menu. Di halaman baca tombol itu
 * dimatikan, supaya pembaca tidak terganggu ajakan saat sedang membaca.
 */
export default function Masthead({ aktif, ajakan = true }: { aktif?: Bagian; ajakan?: boolean }) {
  return (
    <header className="masthead">
      <div className="halaman masthead-isi">
        <Link href="/" aria-label="belummenyerah, ke beranda">
          <Logo />
        </Link>
        <nav className="nav" aria-label="Menu utama">
          <Link href="/blog" aria-current={aktif === 'blog' ? 'page' : undefined}>
            Blog
          </Link>
          <Link href="/belajar" aria-current={aktif === 'belajar' ? 'page' : undefined}>
            Belajar
          </Link>
          <Link href="/tentang" aria-current={aktif === 'tentang' ? 'page' : undefined}>
            Tentang
          </Link>
          {ajakan && (
            <Link href="/berlangganan" className="tombol tombol-kecil">
              Langganan gratis
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
