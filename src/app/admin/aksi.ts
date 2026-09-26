'use server';

import { revalidatePath } from 'next/cache';
import { klienServer } from '@/lib/supabase/server';
import { buatSlug, hitungMenitBaca } from '@/lib/format';
import type { FormatTulisan, Topik, StatusTulisan } from '@/lib/types';

export type DataTulisan = {
  id?: string;
  judul: string;
  slug: string;
  deck: string;
  isi: string;
  topik: Topik;
  format: FormatTulisan;
  nomor: string;
  penulis: string;
  status: StatusTulisan;
};

export type Hasil = { ok: boolean; pesan: string; id?: string; slug?: string };

export async function simpanTulisan(form: DataTulisan): Promise<Hasil> {
  const supabase = await klienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const judul = form.judul.trim();
  if (!judul) return { ok: false, pesan: 'Judulnya belum diisi.' };

  const slug = (form.slug.trim() ? buatSlug(form.slug) : buatSlug(judul)) || 'tanpa-judul';
  const nomor = form.nomor.trim() ? Number.parseInt(form.nomor, 10) : null;

  if (nomor !== null && Number.isNaN(nomor)) {
    return { ok: false, pesan: 'Nomornya harus angka.' };
  }

  const baris = {
    judul,
    slug,
    deck: form.deck.trim(),
    isi: form.isi,
    topik: form.topik,
    format: form.format,
    nomor,
    penulis: form.penulis.trim() || 'Redaksi',
    status: form.status,
    menit_baca: hitungMenitBaca(form.isi),
  };

  // Tanggal terbit dikunci sekali, saat pertama kali statusnya jadi 'terbit'.
  let terbitPada: string | null | undefined;
  if (form.status === 'terbit') {
    if (form.id) {
      const { data } = await supabase
        .from('tulisan')
        .select('terbit_pada')
        .eq('id', form.id)
        .maybeSingle();
      const lama = (data as { terbit_pada: string | null } | null)?.terbit_pada;
      terbitPada = lama ?? new Date().toISOString();
    } else {
      terbitPada = new Date().toISOString();
    }
  }

  const isian = terbitPada === undefined ? baris : { ...baris, terbit_pada: terbitPada };

  const { data, error } = form.id
    ? await supabase.from('tulisan').update(isian).eq('id', form.id).select('id, slug').single()
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
  revalidatePath('/baca');
  revalidatePath('/admin');
  revalidatePath(`/topik/${form.topik}`);
  revalidatePath(`/baca/${hasil.slug}`);

  return { ok: true, pesan: 'Tersimpan.', id: hasil.id, slug: hasil.slug };
}

export async function hapusTulisan(id: string): Promise<Hasil> {
  const supabase = await klienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const { error } = await supabase.from('tulisan').delete().eq('id', id);
  if (error) return { ok: false, pesan: `Gagal menghapus: ${error.message}` };

  revalidatePath('/');
  revalidatePath('/baca');
  revalidatePath('/admin');

  return { ok: true, pesan: 'Terhapus.' };
}
