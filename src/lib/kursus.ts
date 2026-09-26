import { klienServer, supabaseTerpasang } from './supabase/server';
import type { Kursus, KursusLengkap, Modul, Pelajaran } from './types';

/** Katalog kursus terbit, mengikuti urutan yang diatur redaksi. */
export async function ambilKatalog(): Promise<Kursus[]> {
  if (!supabaseTerpasang()) return [];

  const supabase = await klienServer();
  const { data, error } = await supabase
    .from('kursus')
    .select('*')
    .eq('status', 'terbit')
    .order('urutan', { ascending: true })
    .order('terbit_pada', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('[kursus] gagal mengambil katalog:', error.message);
    return [];
  }
  return (data ?? []) as Kursus[];
}

export type KursusRingkas = Kursus & { jumlah_pelajaran: number; total_menit: number };

/** Katalog beserta jumlah pelajaran dan total menit setiap kursus. */
export async function ambilKatalogRingkas(): Promise<KursusRingkas[]> {
  const katalog = await ambilKatalog();
  if (katalog.length === 0) return [];

  const supabase = await klienServer();
  const { data } = await supabase
    .from('pelajaran')
    .select('kursus_id, menit')
    .in(
      'kursus_id',
      katalog.map((k) => k.id),
    );

  const semua = (data ?? []) as { kursus_id: string; menit: number }[];

  return katalog.map((k) => {
    const miliknya = semua.filter((p) => p.kursus_id === k.id);
    return {
      ...k,
      jumlah_pelajaran: miliknya.length,
      total_menit: miliknya.reduce((j, p) => j + (p.menit || 0), 0),
    };
  });
}

/** Satu kursus beserta seluruh modul dan pelajarannya, sudah terurut. */
export async function ambilKursus(slug: string): Promise<KursusLengkap | null> {
  if (!supabaseTerpasang()) return null;

  const supabase = await klienServer();
  const { data: dataKursus, error } = await supabase
    .from('kursus')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[kursus] gagal mengambil kursus:', error.message);
    return null;
  }
  if (!dataKursus) return null;

  const kursus = dataKursus as Kursus;

  const [{ data: dataModul }, { data: dataPelajaran }] = await Promise.all([
    supabase.from('modul').select('*').eq('kursus_id', kursus.id).order('urutan'),
    supabase.from('pelajaran').select('*').eq('kursus_id', kursus.id).order('urutan'),
  ]);

  const semuaModul = (dataModul ?? []) as Modul[];
  const semuaPelajaran = (dataPelajaran ?? []) as Pelajaran[];

  return {
    ...kursus,
    modul: semuaModul.map((m) => ({
      ...m,
      pelajaran: semuaPelajaran.filter((p) => p.modul_id === m.id),
    })),
  };
}

/** Daftar pelajaran yang diratakan, dipakai untuk navigasi sebelumnya/berikutnya. */
export function ratakan(kursus: KursusLengkap): Pelajaran[] {
  return kursus.modul.flatMap((m) => m.pelajaran);
}

export function hitungMenit(kursus: KursusLengkap): number {
  return ratakan(kursus).reduce((jumlah, p) => jumlah + (p.menit || 0), 0);
}

export { NAMA_TINGKAT, idYouTube } from './kursus-umum';
