import type { Metadata } from 'next';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import ArrowIcon from '@/components/ArrowIcon';
import { ARTIKEL_BLOG } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Bacaan singkat untuk usaha sehari-hari. Bahas uang, jualan, dan langkah kecil yang bisa dicoba.',
  alternates: { canonical: '/blog' },
};

export default function HalamanBlog() {
  return (
    <>
      <Masthead aktif="blog" ajakan={false} />
      <main id="isi" className="halaman blog-baru">
        <header className="blog-baru__head">
          <span className="kicker">Blog</span>
          <h1>Usaha sehari-hari,<br />dibahas pelan-pelan.</h1>
          <p>Bacaan singkat tentang uang, jualan, dan langkah kecil yang bisa kamu coba.</p>
        </header>
        <ul className="blog-baru__daftar">
          {ARTIKEL_BLOG.map((artikel) => (
            <li key={artikel.slug}>
              <Link href={`/blog/${artikel.slug}`} className="blog-baru__tautan">
                <div>
                  <span className="blog-baru__waktu">{artikel.menitBaca} menit baca</span>
                  <h2>{artikel.judul}</h2>
                  <p>{artikel.ringkasan}</p>
                  <span className="blog-baru__baca">Baca tulisan <ArrowIcon /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Kaki />
    </>
  );
}
