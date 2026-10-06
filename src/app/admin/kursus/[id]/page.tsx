import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditorKursus from '@/components/EditorKursus';
import SusunanKursus from '@/components/SusunanKursus';
import { requireAdminPage } from '@/lib/admin-auth';
import { supabaseTerpasang } from '@/lib/supabase/server';
import type { Kursus, Modul, ModulLengkap, Pelajaran } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

export default async function SuntingKursus({ params }: Props) {
  const { id } = await params;
  if (!supabaseTerpasang()) notFound();

  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from('kursus').select('*').eq('id', id).maybeSingle();
  const kursus = data as Kursus | null;
  if (!kursus) notFound();

  const [{ data: dataModul }, { data: dataPelajaran }] = await Promise.all([
    supabase.from('modul').select('*').eq('kursus_id', kursus.id).order('urutan'),
    supabase.from('pelajaran').select('*').eq('kursus_id', kursus.id).order('urutan'),
  ]);

  const semuaModul = (dataModul ?? []) as Modul[];
  const semuaPelajaran = (dataPelajaran ?? []) as Pelajaran[];

  const modul: ModulLengkap[] = semuaModul.map((m) => ({
    ...m,
    pelajaran: semuaPelajaran.filter((p) => p.modul_id === m.id),
  }));

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
          <span className="kicker">Sunting kursus</span>
          <h1 className="judul-seksi" style={{ marginTop: 12, maxWidth: 720 }}>
            {kursus.judul}
          </h1>
          <span className="pesan-kecil" style={{ display: 'block', marginTop: 8 }}>
            {semuaModul.length} modul · {semuaPelajaran.length} pelajaran ·{' '}
            {kursus.status === 'terbit' ? 'terbit' : 'masih draf'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/kursus" className="tombol tombol-garis tombol-kecil">
            ← Semua kursus
          </Link>
          {kursus.status === 'terbit' && (
            <Link
              href={`/belajar/${kursus.slug}`}
              target="_blank"
              rel="noreferrer"
              className="tombol tombol-garis tombol-kecil"
            >
              Lihat di situs ↗
            </Link>
          )}
        </div>
      </div>

      <EditorKursus awal={kursus} />

      <div style={{ marginTop: 56 }}>
        <span className="label" style={{ paddingBottom: 18 }}>
          Susunan materi
        </span>
        <SusunanKursus kursusId={kursus.id} modul={modul} />
      </div>
    </div>
  );
}
