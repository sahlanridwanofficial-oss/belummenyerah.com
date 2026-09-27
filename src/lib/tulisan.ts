import { klienServer, supabaseTerpasang } from './supabase/server';
import type { Tulisan } from './types';

const RINGKAS =
  'id, slug, judul, deck, format, nomor, penulis, status, menit_baca, terbit_pada, dibuat_pada, diubah_pada';

export type TulisanRingkas = Omit<Tulisan, 'isi'>;

/** Tulisan terbit, terbaru dulu. */
export async function ambilTerbit(batas = 20): Promise<TulisanRingkas[]> {
  if (!supabaseTerpasang()) return [];

  const supabase = await klienServer();
  const kueri = supabase
    .from('tulisan')
    .select(RINGKAS)
    .eq('status', 'terbit')
    .order('terbit_pada', { ascending: false, nullsFirst: false })
    .limit(batas);


  const { data, error } = await kueri;
  if (error) {
    console.error('[tulisan] gagal mengambil daftar:', error.message);
    return [];
  }
  return (data ?? []) as unknown as TulisanRingkas[];
}

/** Satu tulisan lengkap dengan isinya. Draf hanya terbaca kalau sudah login. */
export async function ambilSatu(slug: string): Promise<Tulisan | null> {
  if (!supabaseTerpasang()) return null;

  const supabase = await klienServer();
  const { data, error } = await supabase.from('tulisan').select('*').eq('slug', slug).maybeSingle();

  if (error) {
    console.error('[tulisan] gagal mengambil satu:', error.message);
    return null;
  }
  return (data as Tulisan) ?? null;
}

export async function ambilTetangga(sekarang: TulisanRingkas): Promise<TulisanRingkas | null> {
  if (!supabaseTerpasang() || !sekarang.terbit_pada) return null;

  const supabase = await klienServer();
  const { data } = await supabase
    .from('tulisan')
    .select(RINGKAS)
    .eq('status', 'terbit')
    .lt('terbit_pada', sekarang.terbit_pada)
    .order('terbit_pada', { ascending: false })
    .limit(1);

  return ((data ?? [])[0] as unknown as TulisanRingkas) ?? null;
}

