'use server';

import { revalidatePath } from 'next/cache';
import { klienServer } from '@/lib/supabase/server';
import { buatSlug, hitungMenitBaca } from '@/lib/format';
import type { FormatTulisan, Jalur, StatusTulisan } from '@/lib/types';

export type MuatanTulisan = {
  id?: string;
  judul: string;
  slug: string;
  deck: string;
  isi: string;
  jalur: Jalur;
  format: FormatTulisan;
  nomor: string;
  penulis: string;
  status: StatusTulisan;
};

export type Hasil = { ok: boolean; pesan: string; id?: string; slug?: string };

export async function simpanTulisan(muatan: MuatanTulisan): Promise<Hasil> {
  const supabase = await klienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, pesan: 'Sesimu sudah habis. Masuk lagi, ya.' };

  const judul = muatan.judul.trim();
  if (!judul) return { ok: false, pesan: 'Judulnya belum diisi.' };

  const slug = (muatan.slug.trim() ? buatSlug(muatan.slug) : buatSlug(judul)) || 'tanpa-judul';
  const nomor = muatan.nomor.trim() ? Number.parseInt(muatan.nomor, 10) : null;

  if (nomor !== null && Number.isNaN(nomor)) {
    return { ok: false, pesan: 'Nomornya harus angka.' };
  }

  const baris = {
    judul,
    slug,
    deck: muatan.deck.trim(),
    isi: muatan.isi,
    jalur: muatan.jalur,
    format: muatan.format,
    nomor,
    penulis: muatan.penulis.trim() || 'Redaksi',
    status: muatan.status,
    menit_baca: hitungMenitBaca(muatan.isi),
  };

  // Tanggal terbit dikunci sekali, saat pertama kali statusnya jadi 'terbit'.
  let terbitPada: string | null | undefined;
  if (muatan.status === 'terbit') {
    if (muatan.id) {
      const { data } = await supabase
        .from('tulisan')
        .select('terbit_pada')
        .eq('id', muatan.id)
        .maybeSingle();
      const lama = (data as { terbit_pada: string | null } | null)?.terbit_pada;
      terbitPada = lama ?? new Date().toISOString();
    } else {
      terbitPada = new Date().toISOString();
    }
  }

  const isian = terbitPada === undefined ? baris : { ...baris, terbit_pada: terbitPada };

  const { data, error } = muatan.id
    ? await supabase.from('tulisan').update(isian).eq('id', muatan.id).select('id, slug').single()
    : await supabase.from('tulisan').insert(isian).select('id, slug').single();

  if (error) {
    const bentrok = error.code === '23505';
    return {
      ok: false,
      pesan: bentrok
        ? `Slug “${slug}” sudah dipakai tulisan lain. Ganti dulu.`
        : `Gagal menyimpan: ${error.message}`,
    };
  }

  const hasil = data as { id: string; slug: string };

  revalidatePath('/');
  revalidatePath('/arsip');
  revalidatePath('/admin');
  revalidatePath(`/${muatan.jalur}`);
  revalidatePath(`/catatan/${hasil.slug}`);

  return { ok: true, pesan: 'Tersimpan.', id: hasil.id, slug: hasil.slug };
}

export async function hapusTulisan(id: string): Promise<Hasil> {
  const supabase = await klienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, pesan: 'Sesimu sudah habis. Masuk lagi, ya.' };

  const { error } = await supabase.from('tulisan').delete().eq('id', id);
  if (error) return { ok: false, pesan: `Gagal menghapus: ${error.message}` };

  revalidatePath('/');
  revalidatePath('/arsip');
  revalidatePath('/admin');

  return { ok: true, pesan: 'Terhapus.' };
}
