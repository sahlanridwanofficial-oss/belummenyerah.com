import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditorTulisan from '@/components/EditorTulisan';
import { requireAdminPage } from '@/lib/admin-auth';
import { supabaseTerpasang } from '@/lib/supabase/server';
import { tanggalPanjang } from '@/lib/format';
import type { Tulisan } from '@/lib/types';
import { PUBLIC_ARTICLES_ENABLED } from '@/lib/article-visibility';

type Props = { params: Promise<{ id: string }> };

export default async function SuntingTulisan({ params }: Props) {
  const { id } = await params;
  if (!supabaseTerpasang()) notFound();

  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from('tulisan').select('*').eq('id', id).maybeSingle();
  if (error) return <div className="halaman" style={{ paddingBlock: 48 }}><p className="pesan-buruk" role="alert">Tulisan belum bisa dimuat. Coba muat ulang halaman.</p><Link href="/admin">Kembali ke arsip</Link></div>;
  const tulisan = data as Tulisan | null;
  if (!tulisan) notFound();

  return (
    <div className="halaman" style={{ paddingBlock: 48 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 36,
        }}
      >
        <div>
          <span className="kicker">Sunting</span>
          <h1 className="judul-seksi" style={{ marginTop: 12, maxWidth: 720 }}>
            {tulisan.judul}
          </h1>
          <span className="pesan-kecil" style={{ display: 'block', marginTop: 8 }}>
            {tulisan.status === 'terbit'
              ? `Ditandai siap dikirim ${tanggalPanjang(tulisan.terbit_pada)}`
              : 'Masih draf'}
          </span>
        </div>
        {PUBLIC_ARTICLES_ENABLED && tulisan.status === 'terbit' && (
          <Link
            href={`/blog/${tulisan.slug}`}
            target="_blank"
            rel="noreferrer"
            className="tombol tombol-garis tombol-kecil"
          >
            Lihat di situs ↗
          </Link>
        )}
      </div>

      <EditorTulisan awal={tulisan} />
    </div>
  );
}
