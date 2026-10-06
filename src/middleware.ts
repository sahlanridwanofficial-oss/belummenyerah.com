import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-access';

type CookieBaru = { name: string; value: string; options?: CookieOptions };

/**
 * Menyegarkan cookie sesi Supabase di setiap permintaan, dan menutup
 * /admin untuk siapa pun yang tidak terverifikasi sebagai pemilik.
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

  const jalan = request.nextUrl.pathname;
  const keAdmin = jalan === '/admin' || jalan.startsWith('/admin/');
  const keLogin = jalan === '/admin/login';

  // Public pages need session refresh, not an admin permission lookup.
  if (!keAdmin) {
    try { await supabase.auth.getUser(); } catch { /* Public reading remains available. */ }
    return response;
  }

  const access = await checkAdminAccess(supabase);
  const redirectTo = (tujuan: URL) => {
    const redirect = NextResponse.redirect(tujuan);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!keLogin && !access.ok) {
    const tujuan = request.nextUrl.clone();
    tujuan.pathname = '/admin/login';
    tujuan.search = '';
    tujuan.searchParams.set('lanjut', jalan);
    if (access.reason !== 'unauthenticated') {
      tujuan.searchParams.set('akses', access.reason === 'forbidden' ? 'ditolak' : 'tidak-tersedia');
    }
    return redirectTo(tujuan);
  }

  // A signed-in non-admin may stay on login to use the correct account.
  if (keLogin && access.ok) {
    const tujuan = request.nextUrl.clone();
    tujuan.pathname = '/admin';
    tujuan.search = '';
    return redirectTo(tujuan);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
