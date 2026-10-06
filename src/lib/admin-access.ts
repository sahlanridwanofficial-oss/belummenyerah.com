import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminAccess =
  | { ok: true; userId: string }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' | 'unavailable' };

/** Shared by middleware and server entrypoints. Never trust editable user metadata. */
export async function checkAdminAccess(client: Pick<SupabaseClient, 'auth' | 'rpc'>): Promise<AdminAccess> {
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { ok: false, reason: 'unauthenticated' };
    const permission = await client.rpc('is_admin');
    if (permission.error) return { ok: false, reason: 'unavailable' };
    if (permission.data !== true) return { ok: false, reason: 'forbidden' };
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
