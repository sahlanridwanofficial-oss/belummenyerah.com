import { NextResponse } from 'next/server';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';
import { klienResend, resendTerpasang, suratSelamatDatang } from '@/lib/email';

export const runtime = 'nodejs';

const POLA_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  if (!supabaseTerpasang()) {
    return NextResponse.json(
      { pesan: 'Pendaftaran belum aktif. Database-nya belum tersambung.' },
      { status: 503 },
    );
  }

  let email = '';
  let sumber: string | null = null;

  try {
    const badan = (await request.json()) as { email?: string; sumber?: string };
    email = (badan.email ?? '').trim().toLowerCase();
    sumber = badan.sumber?.slice(0, 120) ?? null;
  } catch {
    return NextResponse.json({ pesan: 'Permintaannya tidak terbaca.' }, { status: 400 });
  }

  if (!POLA_EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ pesan: 'Alamat emailnya sepertinya keliru.' }, { status: 400 });
  }

  const supabase = await klienServer();
  const { error } = await supabase.rpc('daftar_pelanggan', { p_email: email, p_sumber: sumber });

  if (error) {
    console.error('[berlangganan] gagal:', error.message);
    return NextResponse.json(
      { pesan: 'Gagal mendaftar. Coba lagi sebentar lagi.' },
      { status: 500 },
    );
  }

  // Surat selamat datang bersifat pelengkap — kegagalannya tidak membatalkan pendaftaran.
  if (resendTerpasang()) {
    try {
      const { data } = await supabase
        .from('pelanggan')
        .select('token')
        .eq('email', email)
        .maybeSingle();

      const token = (data as { token?: string } | null)?.token;
      if (token) {
        const surat = suratSelamatDatang(token);
        await klienResend()?.emails.send({
          from: process.env.EMAIL_PENGIRIM as string,
          to: email,
          subject: surat.subjek,
          html: surat.html,
          text: surat.teks,
          ...(process.env.EMAIL_BALASAN ? { replyTo: process.env.EMAIL_BALASAN } : {}),
        });
      }
    } catch (e) {
      console.error('[berlangganan] surat selamat datang gagal:', e);
    }
  }

  return NextResponse.json({ pesan: 'Sudah masuk. Sampai jumpa Senin pagi.' });
}
