import { NextResponse } from 'next/server';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** Only the explicit same-origin confirmation form may change the subscription. */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) {
    return new NextResponse('Permintaan tidak diizinkan.', { status: 403 });
  }

  let token = '';
  try {
    const form = await request.formData();
    const value = form.get('token');
    if (typeof value === 'string') token = value;
  } catch {
    return new NextResponse('Permintaan tidak terbaca.', { status: 400 });
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return new NextResponse('Tautan tidak lengkap.', { status: 400 });
  }

  let berhasil = false;
  try {
    if (supabaseTerpasang()) {
      const supabase = await klienServer();
      const { data, error } = await supabase.rpc('berhenti_langganan', { p_token: token });
      berhasil = !error && data === true;
    }
  } catch {
    // Keep the token available for a retry without exposing internal errors.
  }

  if (berhasil) {
    // Completion is rendered only by the POST that received a successful RPC result.
    // No query parameter, cookie, or subsequent GET can manufacture this state.
    return new NextResponse(`<!doctype html><html lang="id"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="robots" content="noindex, nofollow"><meta name="referrer" content="strict-origin">
      <title>Berhenti berlangganan · belummenyerah</title>
      <style>body{margin:0;background:#f4f3ef;color:#14140f;font:18px/1.7 system-ui,sans-serif}main{max-width:680px;margin:12vh auto;padding:24px}h1{font-size:clamp(30px,6vw,48px);line-height:1.15}a{display:inline-block;margin-top:24px;color:inherit}p{max-width:600px}</style>
      </head><body><main><p>belummenyerah</p><h1>Kamu sudah berhenti berlangganan.</h1>
      <p>Permintaanmu berhasil diproses. Terima kasih sudah pernah membaca. Pintunya tetap terbuka kalau suatu hari mau kembali.</p>
      <a href="/">Kembali ke beranda</a></main></body></html>`, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'strict-origin',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      },
    });
  }

  const tujuan = new URL('/berhenti', request.url);
  tujuan.searchParams.set('hasil', 'gagal');
  tujuan.searchParams.set('token', token);
  const response = NextResponse.redirect(tujuan, 303);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'strict-origin');
  return response;
}
