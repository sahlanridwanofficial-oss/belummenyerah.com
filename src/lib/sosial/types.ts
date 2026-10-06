export type PlatformSosial = 'instagram' | 'threads';
export type PengaturanSosial = {
  timezone: string;
  timezoneConfirmed: boolean;
  creation: { paused: true; cadence: 'weekly'; weekday: number | null; localTime: string | null; batchConcepts: number };
  publishing: {
    paused: true;
    instagram: { weekdays: number[]; localTime: string | null };
    threads: { weekdays: number[]; localTime: string | null };
    monthlyNetworkPostCap: number;
    maxLateMinutes: number;
  };
};
export type BarisPengaturanSosial = {
  owner_user_id: string;
  version: number;
  provider: 'disabled';
  creation_paused: true;
  publishing_paused: true;
  settings: PengaturanSosial;
  updated_at: string;
};
export type DrafSosial = {
  platform: PlatformSosial;
  account_id: string | null;
  title: string;
  text: string;
  slides: string[];
  sources: string[];
};
export type VersiSosial = {
  post_id: string;
  revision: number;
  owner_user_id: string;
  title: string;
  text: string;
  slides: string[];
  sources: string[];
  content_sha256: string;
  created_at: string;
};
export type PosSosial = {
  id: string;
  owner_user_id: string;
  platform: PlatformSosial;
  account_id: string | null;
  current_revision: number;
  created_at: string;
  updated_at: string;
};
export type PersetujuanSosial = {
  id: string;
  owner_user_id: string;
  post_id: string;
  revision: number;
  content_sha256: string;
  target_platform: PlatformSosial;
  target_account_id: string | null;
  scope: 'content_only';
  approved_at: string;
};
export type AkunSosial = {
  id: string;
  owner_user_id: string;
  platform: PlatformSosial;
  display_handle: string | null;
  provider: 'disabled';
  connection_status: 'unverified';
  created_at: string;
};
export type KartuPosSosial = PosSosial & { version: VersiSosial; approval: PersetujuanSosial | null };
export type DataMejaSosial = { settings: BarisPengaturanSosial | null; accounts: AkunSosial[]; posts: KartuPosSosial[] };
export type ItemPersetujuan = { post_id: string; revision: number; content_sha256: string };
export type HasilSosial = { ok: boolean; pesan: string };
