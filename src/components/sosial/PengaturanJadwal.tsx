'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { simpanPengaturanSosial } from '@/app/admin/sosial/aksi';
import { pengaturanAwal } from '@/lib/sosial/validasi';
import type { BarisPengaturanSosial, PengaturanSosial } from '@/lib/sosial/types';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function PengaturanJadwal({ row }: { row: BarisPengaturanSosial | null }) {
  const [settings, setSettings] = useState<PengaturanSosial>(() => row?.settings ?? pengaturanAwal());
  const [pending, start] = useTransition(), [message, setMessage] = useState(''), [error, setError] = useState(false);
  const router = useRouter();
  function days(platform: 'instagram' | 'threads', day: number) {
    const old = settings.publishing[platform].weekdays;
    setSettings({ ...settings, publishing: { ...settings.publishing, [platform]: { ...settings.publishing[platform], weekdays: old.includes(day) ? old.filter((value) => value !== day) : [...old, day].sort() } } });
  }
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    start(async () => {
      try {
        const result = await simpanPengaturanSosial(settings, row?.version ?? 0);
        setMessage(result.pesan); setError(!result.ok); if (result.ok) router.refresh();
      } catch { setError(true); setMessage('Pengaturan belum tersimpan. Coba lagi setelah memuat ulang.'); }
    });
  }
  return <section className="sosial-panel" aria-labelledby="jadwal-heading">
    <div className="sosial-kicker">Pengaturan terpisah</div><h2 id="jadwal-heading">Atur ritmenya.</h2>
    <p className="sosial-muted">Simpan preferensi jadwal sekarang. Kedua proses tetap dijeda sampai koneksi dan izin aktivasi selesai.</p>
    <form onSubmit={save}>
      <fieldset disabled={pending} className="sosial-fieldset">
        <label className="sosial-field">Zona waktu<input value={settings.timezone} maxLength={100} onChange={(e) => setSettings({ ...settings, timezone: e.target.value, timezoneConfirmed: false })} required /></label>
        <label className="sosial-check"><input type="checkbox" checked={settings.timezoneConfirmed} onChange={(e) => setSettings({ ...settings, timezoneConfirmed: e.target.checked })} />Saya sudah memeriksa zona waktu ini</label>
        <p className="sosial-help">Asia/Jakarta adalah nilai awal yang perlu dikonfirmasi.</p>
        <section className="sosial-setting-group" aria-labelledby="creation-heading"><div className="sosial-section-head"><h3 id="creation-heading">01 · Pembuatan konten</h3><span className="sosial-badge">Dijeda</span></div>
          <div className="sosial-two-col"><label className="sosial-field">Hari pembuatan<select value={settings.creation.weekday ?? ''} onChange={(e) => setSettings({ ...settings, creation: { ...settings.creation, weekday: e.target.value === '' ? null : Number(e.target.value) } })}><option value="">Belum dipilih</option>{HARI.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
          <label className="sosial-field">Jam pembuatan<input type="time" value={settings.creation.localTime ?? ''} onChange={(e) => setSettings({ ...settings, creation: { ...settings.creation, localTime: e.target.value || null } })} /></label></div>
          <label className="sosial-field">Konsep per batch mingguan<input type="number" min={1} max={8} value={settings.creation.batchConcepts} onChange={(e) => setSettings({ ...settings, creation: { ...settings.creation, batchConcepts: Number(e.target.value) } })} required /></label>
          <p className="sosial-help">Satu konsep bisa menjadi satu carousel Instagram dan satu teks Threads. Hasil masuk sebagai draf untuk diperiksa.</p>
        </section>
        <section className="sosial-setting-group" aria-labelledby="publishing-heading"><div className="sosial-section-head"><h3 id="publishing-heading">02 · Penerbitan konten</h3><span className="sosial-badge">Dijeda</span></div>
          {(['instagram', 'threads'] as const).map((platform) => <fieldset className="sosial-platform-schedule" key={platform}><legend>{platform === 'instagram' ? 'Instagram' : 'Threads'}</legend><div className="sosial-day-grid">{HARI.map((day, index) => <label className="sosial-check" key={day}><input type="checkbox" checked={settings.publishing[platform].weekdays.includes(index)} onChange={() => days(platform, index)} />{day.slice(0, 3)}</label>)}</div><label className="sosial-field">Jam {platform === 'instagram' ? 'Instagram' : 'Threads'}<input type="time" value={settings.publishing[platform].localTime ?? ''} onChange={(e) => setSettings({ ...settings, publishing: { ...settings.publishing, [platform]: { ...settings.publishing[platform], localTime: e.target.value || null } } })} /></label></fieldset>)}
          <label className="sosial-field">Batas posting jaringan per bulan<input type="number" min={1} max={20} value={settings.publishing.monthlyNetworkPostCap} onChange={(e) => setSettings({ ...settings, publishing: { ...settings.publishing, monthlyNetworkPostCap: Number(e.target.value) } })} required /></label><p className="sosial-help">Instagram + Threads dihitung dua posting. Nilai awal 16 adalah usulan pilot.</p>
          <label className="sosial-field">Tahan bila jadwal terlambat lebih dari (menit)<input type="number" min={0} max={1440} value={settings.publishing.maxLateMinutes} onChange={(e) => setSettings({ ...settings, publishing: { ...settings.publishing, maxLateMinutes: Number(e.target.value) } })} required /></label>
        </section>
        <button className="sosial-button" type="submit">{pending ? 'Menyimpan…' : 'Simpan pengaturan'}</button>
      </fieldset>
      {message && <p className={error ? 'sosial-message error' : 'sosial-message'} role={error ? 'alert' : 'status'}>{message}</p>}
    </form>
  </section>;
}
