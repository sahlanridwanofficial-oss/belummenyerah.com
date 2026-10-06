'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { buatDrafSosial, revisiDrafSosial } from '@/app/admin/sosial/aksi';
import type { DrafSosial, KartuPosSosial } from '@/lib/sosial/types';

export default function FormDrafSosial({ post }: { post?: KartuPosSosial }) {
  const initial: DrafSosial = post ? { platform: post.platform, account_id: post.account_id, title: post.version.title, text: post.version.text, slides: post.version.slides, sources: post.version.sources } : { platform: 'instagram', account_id: null, title: '', text: '', slides: ['', ''], sources: [''] };
  const [form, setForm] = useState(initial), [message, setMessage] = useState(''), [error, setError] = useState(false), [pending, start] = useTransition();
  const router = useRouter();
  const prefix = post?.id ?? 'new';
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    start(async () => {
      try {
        const result = post ? await revisiDrafSosial(post.id, post.current_revision, form) : await buatDrafSosial(form);
        setMessage(result.pesan); setError(!result.ok);
        if (result.ok) { if (!post) setForm(initial); router.refresh(); }
      } catch { setError(true); setMessage('Draf belum tersimpan. Muat ulang untuk memeriksa versi terbaru.'); }
    });
  }
  return <form onSubmit={save} className="sosial-draft-form"><fieldset className="sosial-fieldset" disabled={pending}>
    {!post && <label className="sosial-field">Platform<select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as 'instagram' | 'threads', slides: e.target.value === 'threads' ? [] : ['', ''] })}><option value="instagram">Instagram · carousel</option><option value="threads">Threads · teks</option></select></label>}
    <label className="sosial-field" htmlFor={`${prefix}-title`}>Judul kerja<input id={`${prefix}-title`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} required /></label>
    <label className="sosial-field" htmlFor={`${prefix}-text`}>{form.platform === 'instagram' ? 'Caption' : 'Teks Threads'}<textarea id={`${prefix}-text`} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={5} required /><span className="sosial-help">{Array.from(form.text).length}/{form.platform === 'threads' ? 500 : 2200} karakter</span></label>
    {form.platform === 'instagram' && <div className="sosial-slides-editor">{form.slides.map((slide, index) => <label key={index} className="sosial-field" htmlFor={`${prefix}-slide-${index}`}>Slide {index + 1}<textarea id={`${prefix}-slide-${index}`} value={slide} onChange={(e) => setForm({ ...form, slides: form.slides.map((value, i) => i === index ? e.target.value : value) })} maxLength={1000} rows={3} required /></label>)}<div className="sosial-actions"><button type="button" className="sosial-button secondary" onClick={() => setForm({ ...form, slides: [...form.slides, ''] })} disabled={form.slides.length >= 10}>Tambah slide</button><button type="button" className="sosial-button secondary" onClick={() => setForm({ ...form, slides: form.slides.slice(0, -1) })} disabled={form.slides.length <= 2}>Hapus slide terakhir</button></div></div>}
    <label className="sosial-field" htmlFor={`${prefix}-sources`}>Sumber atau rujukan materi<textarea id={`${prefix}-sources`} value={form.sources.join('\n')} onChange={(e) => setForm({ ...form, sources: e.target.value.split('\n') })} rows={3} required /><span className="sosial-help">Satu sumber per baris. Cantumkan judul materi atau tautan yang sudah diperiksa.</span></label>
    <button className="sosial-button" type="submit">{pending ? 'Menyimpan…' : post ? 'Simpan sebagai revisi baru' : 'Simpan draf'}</button><p className="sosial-help">{post ? 'Persetujuan sebelumnya tetap tersimpan dalam riwayat, tetapi tidak berlaku untuk revisi baru.' : 'Akun tujuan belum ditautkan. Draf disimpan privat dan tidak diunggah.'}</p>
  </fieldset>{message && <p className={error ? 'sosial-message error' : 'sosial-message'} role={error ? 'alert' : 'status'}>{message}</p>}</form>;
}
