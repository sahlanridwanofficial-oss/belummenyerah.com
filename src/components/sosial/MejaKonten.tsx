'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setujuiIsiBatchSosial } from '@/app/admin/sosial/aksi';
import type { DataMejaSosial, ItemPersetujuan } from '@/lib/sosial/types';
import FormDrafSosial from './FormDrafSosial';
import PengaturanJadwal from './PengaturanJadwal';

export default function MejaKonten({ data }: { data: DataMejaSosial }) {
  const [selected, setSelected] = useState<string[]>([]), [reviewing, setReviewing] = useState(false), [pending, start] = useTransition(), [message, setMessage] = useState(''), [error, setError] = useState(false);
  const router = useRouter();
  const [reviewItems, setReviewItems] = useState<ItemPersetujuan[]>([]);
  const drafts = data.posts.filter((post) => !post.approval), chosen = drafts.filter((post) => selected.includes(post.id));
  function approve() {
    if (pending || !reviewItems.length || reviewItems.length > 50) return;
    if (reviewItems.some((item) => !chosen.some((post) => post.id === item.post_id && post.current_revision === item.revision && post.version.content_sha256 === item.content_sha256))) { setReviewing(false); setError(true); setMessage('Ada revisi yang berubah. Buka review batch lagi untuk memeriksa versi terbaru.'); return; }
    start(async () => {
      try {
        const result = await setujuiIsiBatchSosial(reviewItems);
        setMessage(result.pesan); setError(!result.ok);
        if (result.ok) { setSelected([]); setReviewing(false); router.refresh(); }
      } catch { setError(true); setMessage('Persetujuan belum tersimpan. Muat ulang untuk memastikan versi yang sedang ditinjau.'); }
    });
  }
  return <div className="sosial-layout"><section aria-label="Antrean review konten">
    <details className="sosial-panel sosial-new"><summary>Buat draf baru</summary><FormDrafSosial /></details>
    {message && <p className={error ? 'sosial-message error' : 'sosial-message'} role={error ? 'alert' : 'status'}>{message}</p>}
    <div className="sosial-toolbar"><label className="sosial-check"><input type="checkbox" checked={drafts.length > 0 && chosen.length === Math.min(drafts.length, 50)} disabled={pending || !drafts.length} onChange={(e) => { setSelected(e.target.checked ? drafts.slice(0, 50).map((p) => p.id) : []); setReviewing(false); }} />{drafts.length > 50 ? 'Pilih 50 draf pertama' : 'Pilih semua draf'}</label><button type="button" className="sosial-button" disabled={pending || chosen.length === 0 || chosen.length > 50} onClick={() => { setReviewItems(chosen.map((post) => ({ post_id: post.id, revision: post.current_revision, content_sha256: post.version.content_sha256 }))); setReviewing(true); }}>Review {chosen.length || ''} terpilih</button></div>
    <p className="sosial-help">Maksimal 50 konten per persetujuan. {chosen.length} dipilih dari {drafts.length} draf; lanjutkan dengan batch berikutnya setelah tersimpan.</p>
    {reviewing && <section className="sosial-panel sosial-review" aria-labelledby="review-heading"><h2 id="review-heading">Setujui isi batch ini?</h2><ul>{chosen.map((post) => <li key={post.id}>{post.version.title} · {post.platform} · revisi {post.current_revision}</li>)}</ul><p>Persetujuan ini untuk isi dan susunan slide yang terlihat. Akun, gambar final, tanggal, dan izin unggahan publik masih perlu diselesaikan.</p><div className="sosial-actions"><button className="sosial-button" onClick={approve} disabled={pending || chosen.length === 0 || chosen.length > 50}>{pending ? 'Menyimpan…' : 'Setujui isi batch'}</button><button className="sosial-button secondary" onClick={() => setReviewing(false)} disabled={pending}>Kembali periksa</button></div></section>}
    {!data.posts.length && <div className="sosial-empty"><h2>Belum ada draf tersimpan.</h2><p>Mulai dari satu materi yang berguna untuk pemilik usaha. Simpan versi Instagram dan Threads agar bisa diperiksa bersama.</p><p className="sosial-help">Pembuatan otomatis belum aktif. Daftar kosong ini berasal dari penyimpanan yang berhasil dibaca.</p></div>}
    {data.posts.map((post) => {
      const account = data.accounts.find((a) => a.id === post.account_id);
      return <article className="sosial-card" key={`${post.id}-${post.current_revision}`}>
        <header className="sosial-card-header"><div className="sosial-card-title"><input type="checkbox" aria-label={`Pilih ${post.version.title} untuk ${post.platform}`} checked={selected.includes(post.id) && !post.approval} disabled={pending || !!post.approval || (!selected.includes(post.id) && chosen.length >= 50)} onChange={(e) => { setSelected(e.target.checked ? [...selected, post.id] : selected.filter((id) => id !== post.id)); setReviewing(false); }} /><div><span className="sosial-kicker">{post.platform}</span><h2>{post.version.title}</h2><p className="sosial-help">{account?.display_handle || 'Akun belum ditautkan'} · revisi {post.current_revision}</p></div></div><span className={post.approval ? 'sosial-badge approved' : 'sosial-badge'}>{post.approval ? 'Isi disetujui' : 'Perlu review'}</span></header>
        <p className="sosial-caption">{post.version.text}</p>
        {!!post.version.slides.length && <><p className="sosial-kicker">Susunan teks slide · belum gambar final</p><div className="sosial-slides">{post.version.slides.map((slide, index) => <div className="sosial-slide" key={index}><p>{slide}</p><span>belummenyerah. / {index + 1}</span></div>)}</div></>}
        <details className="sosial-source"><summary>Sumber dan status</summary><ul>{post.version.sources.map((source, i) => <li key={i}>{source}</li>)}</ul><p>{post.approval ? 'Persetujuan isi tercatat untuk revisi ini. Belum dijadwalkan atau diunggah.' : 'Belum ada persetujuan untuk revisi ini.'}</p></details>
        <details className="sosial-edit"><summary>Revisi konten</summary><FormDrafSosial post={post} /></details>
      </article>;
    })}
  </section><aside aria-label="Koneksi dan jadwal">
    <section className="sosial-panel"><div className="sosial-kicker">Status aktivasi</div><h2>Belum aktif.</h2><p className="sosial-muted">Draft dan review bisa disimpan. Provider unggahan dinonaktifkan.</p><ul className="sosial-blockers"><li>Verifikasi akun Instagram dan Threads</li><li>Hubungkan provider dengan izin yang sesuai</li><li>Setujui gambar final dan unggahan publik</li><li>Konfirmasi jadwal, lalu aktifkan prosesnya</li></ul><p className="sosial-help">Belum ada unggahan atau jadwal di platform yang dibuat dari dashboard ini.</p></section>
    <PengaturanJadwal key={data.settings?.version ?? 0} row={data.settings} />
  </aside></div>;
}
