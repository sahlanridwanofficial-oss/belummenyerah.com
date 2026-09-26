import { Resend } from 'resend';
import type { Tulisan } from './types';
import { keHtml, keTeks } from './markdown';
import { penanda, tanggalPanjang } from './format';

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

function lolos(teks: string): string {
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
function bungkus(isiHtml: string, tautanBerhenti: string): string {
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
Kamu menerima ini karena berlangganan di ${situs.replace(/^https?:\/\//, '')}.
</p>
<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b6359;">
<a href="${tautanBerhenti}" style="color:#9c3b23;">Berhenti berlangganan</a>
</p>
</td></tr>

</table></td></tr></table></body></html>`;
}

export function suratTulisan(tulisan: Tulisan, token: string) {
  const situs = alamatSitus();
  const tautanBerhenti = `${situs}/berhenti?token=${token}`;
  const tautanBaca = `${situs}/catatan/${tulisan.slug}`;

  const kepala = `
<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#9c3b23;">${lolos(
    penanda(tulisan.format, tulisan.jalur, tulisan.nomor),
  )}</p>
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:32px;line-height:1.15;color:#191714;">${lolos(
    tulisan.judul,
  )}</h1>
${
  tulisan.deck
    ? `<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:19px;line-height:1.55;color:#57514a;">${lolos(
        tulisan.deck,
      )}</p>`
    : ''
}
<p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6359;">${lolos(
    tulisan.penulis,
  )} &middot; ${tanggalPanjang(tulisan.terbit_pada)} &middot; ${tulisan.menit_baca} menit</p>
<hr style="border:0;border-top:1px solid #ddd6c9;margin:0 0 28px;">
`;

  const ekor = `
<p style="margin:32px 0 0;">
<a href="${tautanBaca}" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#9c3b23;text-decoration:none;">Baca di situs &rarr;</a>
</p>`;

  return {
    subjek: tulisan.judul,
    html: bungkus(kepala + keHtml(tulisan.isi) + ekor, tautanBerhenti),
    teks: `${tulisan.judul}\n\n${tulisan.deck}\n\n${keTeks(tulisan.isi, 4000)}\n\nBaca: ${tautanBaca}\nBerhenti: ${tautanBerhenti}`,
  };
}

export function suratSelamatDatang(token: string) {
  const situs = alamatSitus();
  const tautanBerhenti = `${situs}/berhenti?token=${token}`;

  const isi = `
<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:30px;line-height:1.18;color:#191714;">Terima kasih sudah mendaftar.</h1>
<p style="margin:0 0 16px;">Mulai Senin depan, kamu akan menerima satu catatan tiap pagi awal minggu — tentang kas, harga, utang, dan hal-hal yang biasanya tidak ada yang mau menjelaskan dengan jujur.</p>
<p style="margin:0 0 16px;">Tiap Kamis ada satu lagi: bisa Satu Halaman, Panduan, atau Wawancara dengan pemilik usaha yang pernah hampir berhenti.</p>
<p style="margin:0 0 16px;">Kalau ada pertanyaan soal angka di usahamu, balas saja email ini. Dibaca satu-satu.</p>
<p style="margin:24px 0 0;"><a href="${situs}/arsip" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#9c3b23;text-decoration:none;">Sementara itu, lihat arsipnya &rarr;</a></p>`;

  return {
    subjek: 'Selamat datang di belummenyerah',
    html: bungkus(isi, tautanBerhenti),
    teks: `Terima kasih sudah mendaftar.\n\nMulai Senin depan kamu akan menerima satu catatan tiap pagi awal minggu.\n\nArsip: ${situs}/arsip\nBerhenti: ${tautanBerhenti}`,
  };
}
