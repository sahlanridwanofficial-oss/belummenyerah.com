import { NextResponse } from 'next/server';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';
import { klienResend, resendTerpasang, emailTulisan } from '@/lib/email';
import type { Tulisan } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SEKALI_KIRIM = 100; // batas satu panggilan batch Resend

export async function POST(request: Request) {
  if (!supabaseTerpasang()) {
    return NextResponse.json({ pesan: 'Database belum tersambung.' }, { status: 503 });
  }

  const supabase = await klienServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ pesan: 'Harus login dulu.' }, { status: 401 });
  }

  if (!resendTerpasang()) {
    return NextResponse.json(
      {
        pesan:
          'Pengiriman belum aktif. Isi RESEND_API_KEY dan EMAIL_PENGIRIM di pengaturan environment.',
      },
      { status: 503 },
    );
  }

  let tulisanId = '';
  try {
    const badan = (await request.json()) as { tulisan_id?: string };
    tulisanId = badan.tulisan_id ?? '';
  } catch {
    return NextResponse.json({ pesan: 'Data yang dikirim tidak terbaca.' }, { status: 400 });
  }

  const { data: tulisan } = await supabase
    .from('tulisan')
    .select('*')
    .eq('id', tulisanId)
    .maybeSingle<Tulisan>();

  if (!tulisan) {
    return NextResponse.json({ pesan: 'Tulisannya tidak ditemukan.' }, { status: 404 });
  }

  if (tulisan.status !== 'terbit') {
    return NextResponse.json(
      { pesan: 'Terbitkan dulu tulisannya sebelum dikirim.' },
      { status: 400 },
    );
  }

  const { data: pelanggan, error: galatPelanggan } = await supabase
    .from('pelanggan')
    .select('email, token')
    .eq('status', 'aktif');

  if (galatPelanggan) {
    return NextResponse.json({ pesan: 'Gagal membaca daftar pelanggan.' }, { status: 500 });
  }

  const daftar = (pelanggan ?? []) as { email: string; token: string }[];
  if (daftar.length === 0) {
    return NextResponse.json({ pesan: 'Belum ada pelanggan aktif.' }, { status: 400 });
  }

  const resend = klienResend();
  const dari = process.env.EMAIL_PENGIRIM as string;
  const balasan = process.env.EMAIL_BALASAN;

  let terkirim = 0;
  let gagal = 0;

  for (let i = 0; i < daftar.length; i += SEKALI_KIRIM) {
    const potongan = daftar.slice(i, i + SEKALI_KIRIM);
    const kiriman = potongan.map((p) => {
      const isi = emailTulisan(tulisan, p.token);
      return {
        from: dari,
        to: [p.email],
        subject: isi.subjek,
        html: isi.html,
        text: isi.teks,
        ...(balasan ? { replyTo: balasan } : {}),
      };
    });

    try {
      const { error } = await resend!.batch.send(kiriman);
      if (error) {
        gagal += potongan.length;
        console.error('[kirim] batch gagal:', error);
      } else {
        terkirim += potongan.length;
      }
    } catch (e) {
      gagal += potongan.length;
      console.error('[kirim] batch bermasalah:', e);
    }
  }

  await supabase.from('kiriman').insert({
    tulisan_id: tulisan.id,
    judul: tulisan.judul,
    jumlah_penerima: terkirim,
    jumlah_gagal: gagal,
  });

  return NextResponse.json({
    pesan:
      gagal === 0
        ? `Terkirim ke ${terkirim} pelanggan.`
        : `Terkirim ke ${terkirim} pelanggan, ${gagal} gagal. Periksa log untuk detailnya.`,
    terkirim,
    gagal,
  });
}
