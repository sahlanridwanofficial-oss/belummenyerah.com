import { redirect } from 'next/navigation';
import { klienServer, supabaseTerpasang } from '@/lib/supabase/server';
import { checkAdminAccess } from '@/lib/admin-access';

type Client = Awaited<ReturnType<typeof klienServer>>;
export type AdminContext =
  | { ok: true; supabase: Client; userId: string }
  | { ok: false; reason: 'unconfigured' | 'unauthenticated' | 'forbidden' | 'unavailable' };

export async function getAdminContext(): Promise<AdminContext> {
  if (!supabaseTerpasang()) return { ok: false, reason: 'unconfigured' };
  try {
    const supabase = await klienServer();
    const access = await checkAdminAccess(supabase);
    return access.ok ? { ...access, supabase } : access;
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export async function requireAdminPage(): Promise<Extract<AdminContext, { ok: true }>> {
  const access = await getAdminContext();
  if (access.ok) return access;
  const state = access.reason === 'unauthenticated' ? 'masuk' : access.reason === 'forbidden' ? 'ditolak' : 'tidak-tersedia';
  redirect(`/admin/login?akses=${state}`);
}
