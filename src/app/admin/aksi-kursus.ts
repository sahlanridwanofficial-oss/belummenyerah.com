'use server';

import { revalidatePath } from 'next/cache';
import { klienServer } from '@/lib/supabase/server';
import { buatSlug } from '@/lib/format';
import type { Topik, StatusTulisan, Tingkat } from '@/lib/types';

export type Hasil = { ok: boolean; pesan: string; id?: string };

async function redaksi() {
  const supabase = await klienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function segarkan(slug?: string) {
  revalidatePath('/belajar');
  revalidatePath('/admin/kursus');
  if (slug) revalidatePath(`/belajar/${slug}`, 'layout');
}

/* ---------- kursus ---------- */

export type DataKursus = {
  id?: string;
  judul: string;
  slug: string;
  deck: string;
  ringkasan: string;
  untuk_siapa: string;
  topik: Topik;
  tingkat: Tingkat;
  status: StatusTulisan;
  penulis: string;
  urutan: string;
};

export async function simpanKursus(form: DataKursus): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const judul = form.judul.trim();
  if (!judul) return { ok: false, pesan: 'Judul kursusnya belum diisi.' };

  const slug = (form.slug.trim() ? buatSlug(form.slug) : buatSlug(judul)) || 'kursus';
  const urutan = form.urutan.trim() ? Number.parseInt(form.urutan, 10) : 0;
  if (Number.isNaN(urutan)) return { ok: false, pesan: 'Urutannya harus angka.' };

  const baris = {
    judul,
    slug,
    deck: form.deck.trim(),
    ringkasan: form.ringkasan,
    untuk_siapa: form.untuk_siapa,
    topik: form.topik,
    tingkat: form.tingkat,
    status: form.status,
    penulis: form.penulis.trim() || 'Redaksi',
    urutan,
  };

  let terbitPada: string | undefined;
  if (form.status === 'terbit') {
    if (form.id) {
      const { data } = await supabase
        .from('kursus')
        .select('terbit_pada')
        .eq('id', form.id)
        .maybeSingle();
      terbitPada =
        (data as { terbit_pada: string | null } | null)?.terbit_pada ?? new Date().toISOString();
    } else {
      terbitPada = new Date().toISOString();
    }
  }

  const isian = terbitPada === undefined ? baris : { ...baris, terbit_pada: terbitPada };

  const { data, error } = form.id
    ? await supabase.from('kursus').update(isian).eq('id', form.id).select('id, slug').single()
    : await supabase.from('kursus').insert(isian).select('id, slug').single();

  if (error) {
    return {
      ok: false,
      pesan:
        error.code === '23505'
          ? `Slug “${slug}” sudah dipakai kursus lain. Ganti dulu.`
          : `Gagal menyimpan: ${error.message}`,
    };
  }

  const hasil = data as { id: string; slug: string };
  segarkan(hasil.slug);
  return { ok: true, pesan: 'Tersimpan.', id: hasil.id };
}

export async function hapusKursus(id: string): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const { error } = await supabase.from('kursus').delete().eq('id', id);
  if (error) return { ok: false, pesan: `Gagal menghapus: ${error.message}` };

  segarkan();
  return { ok: true, pesan: 'Kursus terhapus beserta seluruh isinya.' };
}

/* ---------- modul ---------- */

export async function tambahModul(kursusId: string, judul: string, urutan: number): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };
  if (!judul.trim()) return { ok: false, pesan: 'Judul modulnya belum diisi.' };

  const { data, error } = await supabase
    .from('modul')
    .insert({ kursus_id: kursusId, judul: judul.trim(), urutan })
    .select('id')
    .single();

  if (error) return { ok: false, pesan: `Gagal menambah modul: ${error.message}` };

  segarkan();
  return { ok: true, pesan: 'Modul ditambahkan.', id: (data as { id: string }).id };
}

export async function simpanModul(
  id: string,
  judul: string,
  ringkas: string,
  urutan: number,
): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const { error } = await supabase
    .from('modul')
    .update({ judul: judul.trim(), ringkas: ringkas.trim(), urutan })
    .eq('id', id);

  if (error) return { ok: false, pesan: `Gagal menyimpan modul: ${error.message}` };

  segarkan();
  return { ok: true, pesan: 'Modul tersimpan.' };
}

export async function hapusModul(id: string): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const { error } = await supabase.from('modul').delete().eq('id', id);
  if (error) return { ok: false, pesan: `Gagal menghapus modul: ${error.message}` };

  segarkan();
  return { ok: true, pesan: 'Modul terhapus beserta pelajarannya.' };
}

/* ---------- pelajaran ---------- */

export type DataPelajaran = {
  id: string;
  judul: string;
  slug: string;
  ringkas: string;
  isi: string;
  video_url: string;
  menit: string;
  urutan: string;
  modul_id: string;
};

export async function tambahPelajaran(
  kursusId: string,
  modulId: string,
  judul: string,
  urutan: number,
): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };
  if (!judul.trim()) return { ok: false, pesan: 'Judul pelajarannya belum diisi.' };

  const slug = buatSlug(judul) || `pelajaran-${Date.now()}`;

  const { data, error } = await supabase
    .from('pelajaran')
    .insert({ kursus_id: kursusId, modul_id: modulId, judul: judul.trim(), slug, urutan })
    .select('id')
    .single();

  if (error) {
    return {
      ok: false,
      pesan:
        error.code === '23505'
          ? `Slug “${slug}” sudah dipakai pelajaran lain di kursus ini.`
          : `Gagal menambah pelajaran: ${error.message}`,
    };
  }

  segarkan();
  return { ok: true, pesan: 'Pelajaran ditambahkan.', id: (data as { id: string }).id };
}

export async function simpanPelajaran(form: DataPelajaran): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const judul = form.judul.trim();
  if (!judul) return { ok: false, pesan: 'Judulnya belum diisi.' };

  const slug = (form.slug.trim() ? buatSlug(form.slug) : buatSlug(judul)) || 'pelajaran';
  const menit = form.menit.trim() ? Number.parseInt(form.menit, 10) : 0;
  const urutan = form.urutan.trim() ? Number.parseInt(form.urutan, 10) : 0;

  if (Number.isNaN(menit) || Number.isNaN(urutan)) {
    return { ok: false, pesan: 'Menit dan urutan harus angka.' };
  }

  const { error } = await supabase
    .from('pelajaran')
    .update({
      judul,
      slug,
      ringkas: form.ringkas.trim(),
      isi: form.isi,
      video_url: form.video_url.trim() || null,
      menit,
      urutan,
      modul_id: form.modul_id,
    })
    .eq('id', form.id);

  if (error) {
    return {
      ok: false,
      pesan:
        error.code === '23505'
          ? `Slug “${slug}” sudah dipakai pelajaran lain di kursus ini.`
          : `Gagal menyimpan: ${error.message}`,
    };
  }

  segarkan();
  return { ok: true, pesan: 'Tersimpan.' };
}

export async function hapusPelajaran(id: string): Promise<Hasil> {
  const { supabase, user } = await redaksi();
  if (!user) return { ok: false, pesan: 'Sesi kamu sudah berakhir. Silakan masuk lagi.' };

  const { error } = await supabase.from('pelajaran').delete().eq('id', id);
  if (error) return { ok: false, pesan: `Gagal menghapus: ${error.message}` };

  segarkan();
  return { ok: true, pesan: 'Pelajaran terhapus.' };
}
