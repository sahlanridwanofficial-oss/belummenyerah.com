import type { DrafSosial, ItemPersetujuan, PengaturanSosial } from './types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const waktu = (value: unknown) => value === null || (typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value));
function pastikan(kondisi: unknown, pesan: string): asserts kondisi { if (!kondisi) throw new Error(pesan); }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function hari(value: unknown): value is number { return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6; }
function daftarTeks(value: unknown, max: number, length: number): value is string[] {
  return Array.isArray(value) && value.length <= max && value.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= length);
}

export function validasiId(id: unknown): string { pastikan(typeof id === 'string' && UUID.test(id), 'ID konten tidak valid.'); return id; }

export function pengaturanAwal(): PengaturanSosial {
  return { timezone: 'Asia/Jakarta', timezoneConfirmed: false,
    creation: { paused: true, cadence: 'weekly', weekday: null, localTime: null, batchConcepts: 2 },
    publishing: { paused: true, instagram: { weekdays: [], localTime: null }, threads: { weekdays: [], localTime: null }, monthlyNetworkPostCap: 16, maxLateMinutes: 60 } };
}

export function validasiDraf(value: unknown): DrafSosial {
  pastikan(record(value), 'Isi draf tidak valid.');
  pastikan(Object.keys(value).every((key) => ['platform', 'account_id', 'title', 'text', 'slides', 'sources'].includes(key)), 'Ada isian draf yang tidak didukung.');
  pastikan(value.platform === 'instagram' || value.platform === 'threads', 'Pilih Instagram atau Threads.');
  pastikan(value.account_id === null || (typeof value.account_id === 'string' && UUID.test(value.account_id)), 'Identitas akun tidak valid.');
  pastikan(typeof value.title === 'string' && value.title.trim().length > 0 && value.title.length <= 160, 'Judul harus diisi, maksimal 160 karakter.');
  pastikan(typeof value.text === 'string' && value.text.trim().length > 0, 'Teks konten harus diisi.');
  pastikan(Array.from(value.text).length <= (value.platform === 'threads' ? 500 : 2200), 'Teks terlalu panjang untuk platform yang dipilih.');
  pastikan(daftarTeks(value.sources, 10, 1000) && value.sources.length > 0, 'Cantumkan 1–10 sumber atau rujukan materi.');
  pastikan(daftarTeks(value.slides, 10, 1000), 'Slide tidak valid; maksimal 10 slide, 1.000 karakter per slide.');
  pastikan(value.platform === 'instagram' ? value.slides.length >= 2 : value.slides.length === 0, 'Instagram memerlukan 2–10 slide; Threads menggunakan teks tanpa slide.');
  return { platform: value.platform, account_id: value.account_id as string | null, title: value.title.trim(), text: value.text.trim(), slides: value.slides.map((x) => x.trim()), sources: value.sources.map((x) => x.trim()) };
}

export function validasiPengaturan(value: unknown): PengaturanSosial {
  pastikan(record(value) && Object.keys(value).every((key) => ['timezone', 'timezoneConfirmed', 'creation', 'publishing'].includes(key)), 'Pengaturan tidak valid.');
  pastikan(typeof value.timezone === 'string' && value.timezone.length <= 100, 'Zona waktu tidak valid.');
  try { new Intl.DateTimeFormat('id-ID', { timeZone: value.timezone }).format(); } catch { throw new Error('Gunakan zona waktu IANA, misalnya Asia/Jakarta.'); }
  pastikan(typeof value.timezoneConfirmed === 'boolean', 'Konfirmasi zona waktu tidak valid.');
  const c = value.creation, p = value.publishing;
  pastikan(record(c) && record(p), 'Pengaturan pembuatan dan penerbitan diperlukan.');
  pastikan(Object.keys(c).every((key) => ['paused', 'cadence', 'weekday', 'localTime', 'batchConcepts'].includes(key)), 'Isian pembuatan tidak didukung.');
  pastikan(Object.keys(p).every((key) => ['paused', 'instagram', 'threads', 'monthlyNetworkPostCap', 'maxLateMinutes'].includes(key)), 'Isian penerbitan tidak didukung.');
  pastikan(c.paused === true && p.paused === true, 'Pembuatan dan penerbitan harus tetap dijeda pada tahap ini.');
  pastikan(c.cadence === 'weekly' && (c.weekday === null || hari(c.weekday)) && waktu(c.localTime), 'Jadwal pembuatan tidak valid.');
  pastikan(Number.isInteger(c.batchConcepts) && Number(c.batchConcepts) >= 1 && Number(c.batchConcepts) <= 8, 'Batch harus berisi 1–8 konsep.');
  pastikan(Number.isInteger(p.monthlyNetworkPostCap) && Number(p.monthlyNetworkPostCap) >= 1 && Number(p.monthlyNetworkPostCap) <= 20, 'Batas pilot adalah 1–20 posting jaringan per bulan.');
  pastikan(Number.isInteger(p.maxLateMinutes) && Number(p.maxLateMinutes) >= 0 && Number(p.maxLateMinutes) <= 1440, 'Batas keterlambatan harus 0–1.440 menit.');
  for (const platform of ['instagram', 'threads']) {
    const s = p[platform];
    pastikan(record(s) && Object.keys(s).every((key) => ['weekdays', 'localTime'].includes(key)) && Array.isArray(s.weekdays) && s.weekdays.length <= 7 && s.weekdays.every(hari) && new Set(s.weekdays).size === s.weekdays.length && waktu(s.localTime), 'Hari atau jam penerbitan tidak valid.');
  }
  return JSON.parse(JSON.stringify(value)) as PengaturanSosial;
}

export function validasiPersetujuan(value: unknown): ItemPersetujuan[] {
  pastikan(Array.isArray(value) && value.length >= 1 && value.length <= 50, 'Pilih 1–50 konten untuk diperiksa.');
  const result = value.map((item) => {
    pastikan(record(item) && Object.keys(item).every((key) => ['post_id', 'revision', 'content_sha256'].includes(key)), 'Detail persetujuan tidak valid.');
    const post_id = validasiId(item.post_id);
    pastikan(Number.isInteger(item.revision) && Number(item.revision) >= 1, 'Revisi konten tidak valid.');
    pastikan(typeof item.content_sha256 === 'string' && /^[0-9a-f]{64}$/.test(item.content_sha256), 'Sidik isi konten tidak valid. Muat ulang halaman.');
    return { post_id, revision: Number(item.revision), content_sha256: item.content_sha256 };
  });
  pastikan(new Set(result.map((item) => item.post_id)).size === result.length, 'Konten terpilih ganda.');
  return result;
}
