import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import { ARTIKEL_BLOG } from '@/lib/blog';
import { keHtml } from '@/lib/markdown';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTIKEL_BLOG.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artikel = ARTIKEL_BLOG.find((item) => item.slug === slug);
  if (!artikel) notFound();
  return {
    title: artikel.judul,
    description: artikel.ringkasan,
    alternates: { canonical: `/blog/${artikel.slug}` },
    openGraph: { title: artikel.judul, description: artikel.ringkasan, type: 'article' },
  };
}

export default async function HalamanTulisan({ params }: Props) {
  const { slug } = await params;
  const artikel = ARTIKEL_BLOG.find((item) => item.slug === slug);
  if (!artikel) notFound();

  return (
    <>
      <Masthead aktif="blog" ajakan={false} />
      <main id="isi" className="halaman blog-artikel">
        <Link href="/blog" className="blog-artikel__kembali">Kembali ke blog</Link>
        <article>
          <header className="blog-artikel__head">
            <span className="blog-baru__waktu">{artikel.menitBaca} menit baca</span>
            <h1>{artikel.judul}</h1>
            <p>{artikel.ringkasan}</p>
          </header>
          <div className="prosa blog-artikel__isi" dangerouslySetInnerHTML={{ __html: keHtml(artikel.isi) }} />
        </article>
        <nav className="blog-artikel__akhir" aria-label="Setelah membaca">
          <Link href="/blog">Lihat semua tulisan</Link>
        </nav>
      </main>
      <Kaki />
    </>
  );
}
