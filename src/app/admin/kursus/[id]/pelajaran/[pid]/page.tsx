import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditorPelajaran from '@/components/EditorPelajaran';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';
import type { Kursus, Modul, Pelajaran } from '@/lib/types';

type Props = { params: Promise<{ id: string; pid: string }> };

export default async function SuntingPelajaran({ params }: Props) {
  const { id, pid } = await params;
  if (!supabaseTerpasang()) notFound();

  const supabase = await klienServer();

  const [{ data: dataPelajaran }, { data: dataKursus }, { data: dataModul }] = await Promise.all([
    supabase.from('pelajaran').select('*').eq('id', pid).maybeSingle(),
    supabase.from('kursus').select('*').eq('id', id).maybeSingle(),
    supabase.from('modul').select('*').eq('kursus_id', id).order('urutan'),
  ]);

  const pelajaran = dataPelajaran as Pelajaran | null;
  const kursus = dataKursus as Kursus | null;

  if (!pelajaran || !kursus || pelajaran.kursus_id !== kursus.id) notFound();

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
          <span className="kicker">{kursus.judul}</span>
          <h1 className="judul-seksi" style={{ marginTop: 12, maxWidth: 720 }}>
            {pelajaran.judul}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/admin/kursus/${kursus.id}`} className="tombol tombol-garis tombol-kecil">
            ← Susunan kursus
          </Link>
          {kursus.status === 'terbit' && (
            <Link
              href={`/kursus/${kursus.slug}/${pelajaran.slug}`}
              target="_blank"
              rel="noreferrer"
              className="tombol tombol-garis tombol-kecil"
            >
              Lihat di situs ↗
            </Link>
          )}
        </div>
      </div>

      <EditorPelajaran
        awal={pelajaran}
        modul={(dataModul ?? []) as Modul[]}
        kursusId={kursus.id}
      />
    </div>
  );
}
