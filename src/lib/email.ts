import { Resend } from 'resend';
import type { Tulisan } from './types';
import { keHtml, keTeks } from './markdown';
import { penanda, tanggalPanjang } from './format';
import { PUBLIC_ARTICLES_ENABLED } from './article-visibility';

export function resendTerpasang(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_PENGIRIM);
}

export function klienResend(): Resend | null {
  const kunci = process.env.RESEND_API_KEY;
  return kunci ? new Resend(kunci) : null;
}

export function alamatSitus(): string {
  return (process.env.NEXT_PUBLIC_SITUS_URL ?? 'https://belummenyerah.com').replace(/\/$/, '');
}

function escapeHtml(teks: string): string {
  return teks
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Surat dibangun dengan tabel dan gaya sebaris, karena itu satu-satunya
 * cara yang dihormati seluruh klien email lama.
 */
function bungkusEmail(isiHtml: string, tautanBerhenti: string): string {
  const situs = alamatSitus();
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f4ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#f7f4ee;">

<tr><td style="padding-bottom:22px;border-bottom:1px solid #ddd6c9;">
<a href="${situs}" style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#191714;text-decoration:none;letter-spacing:-0.02em;">belummenyerah</a>
</td></tr>

<tr><td style="padding-top:30px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.65;color:#191714;">
${isiHtml}
</td></tr>

<tr><td style="padding-top:40px;border-top:1px solid #ddd6c9;">
<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b6359;">
Kamu menerima email ini karena berlangganan di ${situs.replace(/^https?:\/\//, '')}.
</p>
<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b6359;">
<a href="${tautanBerhenti}" style="color:#9c3b23;">Berhenti berlangganan</a>
</p>
</td></tr>

</table></td></tr></table></body></html>`;
}

export function emailTulisan(tulisan: Tulisan, token: string) {
  const situs = alamatSitus();
  const tautanBerhenti = `${situs}/berhenti?token=${token}`;
  const tautanBaca = `${situs}/blog/${tulisan.slug}`;

  const kepala = `
<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9c3b23;">${escapeHtml(
    penanda(tulisan.format, tulisan.nomor),
  )}</p>
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:32px;line-height:1.15;color:#191714;">${escapeHtml(
    tulisan.judul,
  )}</h1>
${
  tulisan.deck
    ? `<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:19px;line-height:1.55;color:#57514a;">${escapeHtml(
        tulisan.deck,
      )}</p>`
    : ''
}
<p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6359;">${escapeHtml(
    tulisan.penulis,
  )} &middot; ${tanggalPanjang(tulisan.terbit_pada)} &middot; ${tulisan.menit_baca} menit</p>
<hr style="border:0;border-top:1px solid #ddd6c9;margin:0 0 28px;">
`;

  const ekor = PUBLIC_ARTICLES_ENABLED ? `
<p style="margin:32px 0 0;">
<a href="${tautanBaca}" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#9c3b23;text-decoration:none;">Baca di situs &rarr;</a>
</p>` : '';
  const tautanTeks = PUBLIC_ARTICLES_ENABLED ? `Baca: ${tautanBaca}\n` : '';

  return {
    subjek: tulisan.judul,
    html: bungkusEmail(kepala + keHtml(tulisan.isi) + ekor, tautanBerhenti),
    teks: `${tulisan.judul}\n\n${tulisan.deck}\n\n${keTeks(tulisan.isi, 4000)}\n\n${tautanTeks}Berhenti: ${tautanBerhenti}`,
  };
}

export function emailSelamatDatang(token: string) {
  const situs = alamatSitus();
  const tautanBerhenti = `${situs}/berhenti?token=${token}`;

  const isi = `
<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:30px;line-height:1.18;color:#191714;">Terima kasih sudah mendaftar.</h1>
<p style="margin:0 0 16px;">Mulai Senin depan, kamu akan menerima satu catatan setiap Senin pagi tentang kas, harga, dan utang. Hal-hal yang jarang dijelaskan dengan jujur.</p>
<p style="margin:0 0 16px;">Setiap Kamis ada satu kiriman lagi, berupa panduan singkat atau cerita pemilik usaha yang pernah hampir berhenti.</p>
<p style="margin:0 0 16px;">Kalau ada pertanyaan soal angka di usahamu, balas saja email ini. Semua dibaca.</p>
<p style="margin:24px 0 0;"><a href="${situs}/belajar" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#9c3b23;text-decoration:none;">Sementara itu, lihat kursus gratisnya &rarr;</a></p>`;

  return {
    subjek: 'Selamat datang di belummenyerah',
    html: bungkusEmail(isi, tautanBerhenti),
    teks: `Terima kasih sudah mendaftar.\n\nMulai Senin depan kamu akan menerima satu catatan setiap Senin pagi.\n\nKursus gratis: ${situs}/belajar\nBerhenti: ${tautanBerhenti}`,
  };
}
