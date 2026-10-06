import 'server-only';

/** Reuse the site's verified owner guard; RLS/RPCs independently enforce it. */
export { getAdminContext as pemilikSosial } from '@/lib/admin-auth';
