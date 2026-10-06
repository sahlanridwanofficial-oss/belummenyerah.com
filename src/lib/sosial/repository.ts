import 'server-only';
import type { pemilikSosial } from './otorisasi';
import type { AkunSosial, BarisPengaturanSosial, DataMejaSosial, PersetujuanSosial, PosSosial, VersiSosial } from './types';

type Owner = Extract<Awaited<ReturnType<typeof pemilikSosial>>, { ok: true }>;

export async function bacaMejaSosial(owner: Owner): Promise<DataMejaSosial> {
  const db = owner.supabase;
  const [settings, accounts, posts] = await Promise.all([
    db.from('social_settings').select('owner_user_id,version,provider,creation_paused,publishing_paused,settings,updated_at').eq('owner_user_id', owner.userId).maybeSingle(),
    db.from('social_accounts').select('id,owner_user_id,platform,display_handle,provider,connection_status,created_at').eq('owner_user_id', owner.userId).order('created_at', { ascending: false }).limit(20),
    db.from('social_posts').select('id,owner_user_id,platform,account_id,current_revision,created_at,updated_at').eq('owner_user_id', owner.userId).order('updated_at', { ascending: false }).limit(100),
  ]);
  if (settings.error || accounts.error || posts.error) throw new Error('SOCIAL_READ_UNAVAILABLE');
  const base = (posts.data ?? []) as PosSosial[];
  if (!base.length) return { settings: settings.data as BarisPengaturanSosial | null, accounts: (accounts.data ?? []) as AkunSosial[], posts: [] };
  const currentVersions = base.map((p) => {
    if (!/^[0-9a-f-]{36}$/i.test(p.id) || !Number.isInteger(p.current_revision) || p.current_revision < 1) throw new Error('SOCIAL_RECORD_INVALID');
    return `and(post_id.eq.${p.id},revision.eq.${p.current_revision})`;
  }).join(',');
  const [revisions, approvals] = await Promise.all([
    db.from('social_post_revisions').select('post_id,revision,owner_user_id,title,text,slides,sources,content_sha256,created_at').eq('owner_user_id', owner.userId).or(currentVersions).order('revision', { ascending: false }),
    db.from('social_content_approvals').select('id,owner_user_id,post_id,revision,content_sha256,target_platform,target_account_id,scope,approved_at').eq('owner_user_id', owner.userId).or(currentVersions).order('approved_at', { ascending: false }),
  ]);
  if (revisions.error || approvals.error) throw new Error('SOCIAL_READ_UNAVAILABLE');
  const versionRows = (revisions.data ?? []) as VersiSosial[], approvalRows = (approvals.data ?? []) as PersetujuanSosial[];
  return { settings: settings.data as BarisPengaturanSosial | null, accounts: (accounts.data ?? []) as AkunSosial[], posts: base.map((post) => {
    const version = versionRows.find((v) => v.post_id === post.id && v.revision === post.current_revision);
    if (!version) throw new Error('SOCIAL_REVISION_UNAVAILABLE');
    const approval = approvalRows.find((a) => a.post_id === post.id && a.revision === version.revision && a.content_sha256 === version.content_sha256 && a.target_platform === post.platform && a.target_account_id === post.account_id && a.scope === 'content_only') ?? null;
    return { ...post, version, approval };
  }) };
}
