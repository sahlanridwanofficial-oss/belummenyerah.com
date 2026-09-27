import { NextResponse } from 'next/server';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const POLA_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  if (!supabaseTerpasang()) {
    return NextResponse.json(
      { pesan: 'Pendaftaran belum aktif karena database belum tersambung.' },
      { status: 503 },
    );
  }

  let email = '';
  let slug = '';

  try {
    const badan = (await request.json()) as { email?: string; slug?: string };
    email = (badan.email ?? '').trim().toLowerCase();
    slug = (badan.slug ?? '').trim();
  } catch {
    return NextResponse.json({ pesan: 'Data yang dikirim tidak bisa dibaca.' }, { status: 400 });
  }

  if (!POLA_EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ pesan: 'Alamat emailnya sepertinya belum benar.' }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ pesan: 'Kursusnya belum ditentukan.' }, { status: 400 });
  }

  const supabase = await klienServer();
  const { error } = await supabase.rpc('daftar_kursus', { p_slug: slug, p_email: email });

  if (error) {
    console.error('[daftar-kursus] gagal:', error.message);
    const tidakAda = error.message.includes('Kursus tidak ditemukan');
    return NextResponse.json(
      {
        pesan: tidakAda
          ? 'Kursus ini belum terbuka untuk pendaftaran.'
          : 'Pendaftaran gagal. Coba lagi sebentar.',
      },
      { status: tidakAda ? 404 : 500 },
    );
  }

  return NextResponse.json({
    pesan: 'Kamu terdaftar. Materinya sudah bisa dibuka sekarang.',
  });
}
