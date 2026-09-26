import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieBaru = { name: string; value: string; options?: CookieOptions };

export function supabaseTerpasang(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Klien Supabase untuk server component / route handler.
 * Dipakai sebagai pembaca anonim kalau belum login, dan otomatis
 * jadi redaksi begitu cookie sesi ada.
 */
export async function klienServer() {
  const jar = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(daftar: CookieBaru[]) {
          try {
            daftar.forEach(({ name, value, options }) => jar.set({ name, value, ...options }));
          } catch {
            // Dipanggil dari server component — middleware yang menyegarkan sesi.
          }
        },
      },
    },
  );
}
