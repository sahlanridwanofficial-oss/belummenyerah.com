import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieBaru = { name: string; value: string; options?: CookieOptions };

/**
 * Menyegarkan cookie sesi Supabase di setiap permintaan, dan menutup
 * /admin untuk siapa pun yang belum login.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Belum tersambung ke Supabase: biarkan lewat, halaman yang menjelaskan.
  if (!url || !kunci) return response;

  const supabase = createServerClient(url, kunci, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(daftar: CookieBaru[]) {
        daftar.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        daftar.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options }),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jalan = request.nextUrl.pathname;
  const keAdmin = jalan.startsWith('/admin');
  const keLogin = jalan === '/admin/login';

  if (keAdmin && !keLogin && !user) {
    const tujuan = request.nextUrl.clone();
    tujuan.pathname = '/admin/login';
    tujuan.searchParams.set('lanjut', jalan);
    return NextResponse.redirect(tujuan);
  }

  if (keLogin && user) {
    const tujuan = request.nextUrl.clone();
    tujuan.pathname = '/admin';
    tujuan.search = '';
    return NextResponse.redirect(tujuan);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
