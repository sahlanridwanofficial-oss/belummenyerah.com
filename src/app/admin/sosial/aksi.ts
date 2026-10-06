'use server';

import { revalidatePath } from 'next/cache';
import { pemilikSosial } from '@/lib/sosial/otorisasi';
import { validasiDraf, validasiId, validasiPengaturan, validasiPersetujuan } from '@/lib/sosial/validasi';
import type { HasilSosial } from '@/lib/sosial/types';

const denied = (): HasilSosial => ({ ok: false, pesan: 'Akses pemilik belum terverifikasi. Masuk kembali atau selesaikan pengaturan akses.' });
const failure = (): HasilSosial => ({ ok: false, pesan: 'Perubahan belum tersimpan. Muat ulang untuk memeriksa versi terbaru atau kesiapan penyimpanan.' });
function invalid(error: unknown): HasilSosial { return { ok: false, pesan: error instanceof Error ? error.message : 'Isian tidak valid.' }; }
function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function validRevisionResult(value: unknown, ownerId: string, expectedRevision: number, postId?: string): boolean {
  if (!object(value) || value.owner_user_id !== ownerId || value.revision !== expectedRevision || typeof value.content_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(value.content_sha256)) return false;
  try { validasiId(value.post_id); } catch { return false; }
  return !postId || value.post_id === postId;
}

export async function buatDrafSosial(input: unknown): Promise<HasilSosial> {
  const owner = await pemilikSosial(); if (!owner.ok) return denied();
  let form; try { form = validasiDraf(input); } catch (error) { return invalid(error); }
  try {
    const result = await owner.supabase.rpc('social_create_draft', { p_platform: form.platform, p_account_id: form.account_id, p_title: form.title, p_text: form.text, p_slides: form.slides, p_sources: form.sources });
    if (result.error || !validRevisionResult(result.data, owner.userId, 1)) return failure();
    revalidatePath('/admin/sosial'); return { ok: true, pesan: 'Draf tersimpan untuk review. Belum disetujui atau dijadwalkan.' };
  } catch { return failure(); }
}

export async function revisiDrafSosial(postId: unknown, expectedRevision: unknown, input: unknown): Promise<HasilSosial> {
  const owner = await pemilikSosial(); if (!owner.ok) return denied();
  let id, form; try { id = validasiId(postId); form = validasiDraf(input); if (!Number.isInteger(expectedRevision) || Number(expectedRevision) < 1) throw new Error('Revisi tidak valid. Muat ulang halaman.'); } catch (error) { return invalid(error); }
  try {
    // Read target under owner RLS. Revision RPC cannot retarget an existing post.
    const current = await owner.supabase.from('social_posts').select('platform,account_id').eq('owner_user_id', owner.userId).eq('id', id).single();
    if (current.error || !current.data || current.data.platform !== form.platform || current.data.account_id !== form.account_id) return failure();
    const result = await owner.supabase.rpc('social_revise_draft', { p_post_id: id, p_expected_revision: expectedRevision, p_title: form.title, p_text: form.text, p_slides: form.slides, p_sources: form.sources });
    if (result.error || !validRevisionResult(result.data, owner.userId, Number(expectedRevision) + 1, id)) return failure();
    revalidatePath('/admin/sosial'); return { ok: true, pesan: 'Revisi baru tersimpan dan perlu ditinjau lagi. Persetujuan versi lama tidak berlaku untuk versi ini.' };
  } catch { return failure(); }
}

export async function setujuiIsiBatchSosial(input: unknown): Promise<HasilSosial> {
  const owner = await pemilikSosial(); if (!owner.ok) return denied();
  let items; try { items = validasiPersetujuan(input); } catch (error) { return invalid(error); }
  try {
    const result = await owner.supabase.rpc('social_approve_batch', { p_items: items });
    if (result.error || !Array.isArray(result.data) || result.data.length !== items.length) return failure();
    const returned = result.data as unknown[];
    if (!items.every((item) => returned.some((row) => object(row) && row.owner_user_id === owner.userId && row.post_id === item.post_id && row.revision === item.revision && row.content_sha256 === item.content_sha256 && row.scope === 'content_only'))) return failure();
    revalidatePath('/admin/sosial'); return { ok: true, pesan: `${items.length} isi konten disetujui untuk versi yang ditinjau. Ini belum memberi izin atau membuat jadwal unggahan publik.` };
  } catch { return failure(); }
}

export async function simpanPengaturanSosial(input: unknown, expectedVersion: unknown): Promise<HasilSosial> {
  const owner = await pemilikSosial(); if (!owner.ok) return denied();
  let settings; try { settings = validasiPengaturan(input); if (!Number.isInteger(expectedVersion) || Number(expectedVersion) < 0) throw new Error('Versi pengaturan tidak valid. Muat ulang halaman.'); } catch (error) { return invalid(error); }
  try {
    const result = await owner.supabase.rpc('social_save_settings', { p_settings: settings, p_expected_version: expectedVersion });
    if (result.error || !object(result.data) || result.data.owner_user_id !== owner.userId || result.data.version !== Number(expectedVersion) + 1 || result.data.provider !== 'disabled' || result.data.creation_paused !== true || result.data.publishing_paused !== true) return failure();
    revalidatePath('/admin/sosial'); return { ok: true, pesan: 'Pengaturan tersimpan. Pembuatan dan penerbitan tetap dijeda; belum ada proses otomatis yang diaktifkan.' };
  } catch { return failure(); }
}
