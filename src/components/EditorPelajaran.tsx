'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { buatSlug } from '@/lib/format';
import { idYouTube } from '@/lib/kursus-umum';
import { hapusPelajaran, simpanPelajaran, type DataPelajaran } from '@/app/admin/aksi-kursus';
import type { Modul, Pelajaran } from '@/lib/types';

export default function EditorPelajaran({
  awal,
  modul,
  kursusId,
}: {
  awal: Pelajaran;
  modul: Modul[];
  kursusId: string;
}) {
  const router = useRouter();
  const [menyimpan, mulaiSimpan] = useTransition();

  const [judul, setJudul] = useState(awal.judul);
  const [slug, setSlug] = useState(awal.slug);
  const [ringkas, setRingkas] = useState(awal.ringkas);
  const [isi, setIsi] = useState(awal.isi);
  const [videoUrl, setVideoUrl] = useState(awal.video_url ?? '');
  const [menit, setMenit] = useState(String(awal.menit));
  const [urutan, setUrutan] = useState(String(awal.urutan));
  const [modulId, setModulId] = useState(awal.modul_id);

  const [tab, setTab] = useState<'tulis' | 'pratinjau'>('tulis');
  const [pesan, setPesan] = useState('');
  const [buruk, setBuruk] = useState(false);

  const slugDipakai = slug.trim() ? buatSlug(slug) : buatSlug(judul);
  const pratinjau = useMemo(() => marked.parse(isi || '', { async: false }) as string, [isi]);
  const idVideo = idYouTube(videoUrl || null);

  function simpan() {
    const form: DataPelajaran = {
      id: awal.id,
      judul,
      slug: slugDipakai,
      ringkas,
      isi,
      video_url: videoUrl,
      menit,
      urutan,
      modul_id: modulId,
    };

    mulaiSimpan(async () => {
      const hasil = await simpanPelajaran(form);
      setPesan(hasil.pesan);
      setBuruk(!hasil.ok);
      if (hasil.ok) router.refresh();
    });
  }

  async function hapus() {
    if (!window.confirm(`Hapus pelajaran “${awal.judul}”? Ini tidak bisa dibatalkan.`)) return;
    const hasil = await hapusPelajaran(awal.id);
    if (hasil.ok) router.replace(`/admin/kursus/${kursusId}`);
    else {
      setPesan(hasil.pesan);
      setBuruk(true);
    }
  }

  return (
    <div className="susun susun-28">
      <div className="form-baris">
        <div className="form-isian" style={{ flex: '3 1 320px' }}>
          <label htmlFor="judul">Judul pelajaran</label>
          <input
            id="judul"
            className="isian"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
          />
        </div>
        <div className="form-isian" style={{ flex: '2 1 220px' }}>
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            className="isian"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
      </div>

      <div className="form-isian">
        <label htmlFor="ringkas">Ringkasan — satu kalimat di bawah judul</label>
        <input
          id="ringkas"
          className="isian"
          value={ringkas}
          onChange={(e) => setRingkas(e.target.value)}
        />
      </div>

      <div className="form-baris">
        <div className="form-isian" style={{ flex: '2 1 240px' }}>
          <label htmlFor="modul">Modul</label>
          <select
            id="modul"
            className="isian"
            value={modulId}
            onChange={(e) => setModulId(e.target.value)}
          >
            {modul.map((m) => (
              <option key={m.id} value={m.id}>
                {m.judul}
              </option>
            ))}
          </select>
        </div>
        <div className="form-isian">
          <label htmlFor="urutan">Urutan</label>
          <input
            id="urutan"
            className="isian"
            inputMode="numeric"
            value={urutan}
            onChange={(e) => setUrutan(e.target.value)}
          />
        </div>
        <div className="form-isian">
          <label htmlFor="menit">Perkiraan menit</label>
          <input
            id="menit"
            className="isian"
            inputMode="numeric"
            value={menit}
            onChange={(e) => setMenit(e.target.value)}
          />
        </div>
      </div>

      <div className="form-isian">
        <label htmlFor="video">Tautan video YouTube — kosongkan kalau pelajarannya tulisan saja</label>
        <input
          id="video"
          className="isian"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
        />
        <span className={videoUrl && !idVideo ? 'pesan-buruk' : 'pesan-kecil'}>
          {videoUrl
            ? idVideo
              ? `Video terbaca: ${idVideo}`
              : 'Tautannya belum dikenali sebagai tautan YouTube.'
            : 'Atur videonya sebagai “Unlisted” di YouTube supaya tidak muncul di kanal publik.'}
        </span>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={tab === 'tulis' ? 'tombol tombol-kecil' : 'tombol tombol-garis tombol-kecil'}
              onClick={() => setTab('tulis')}
            >
              Tulis
            </button>
            <button
              type="button"
              className={
                tab === 'pratinjau' ? 'tombol tombol-kecil' : 'tombol tombol-garis tombol-kecil'
              }
              onClick={() => setTab('pratinjau')}
            >
              Pratinjau
            </button>
          </div>
          <span className="pesan-kecil">Materi tulisan — Markdown</span>
        </div>

        {tab === 'tulis' ? (
          <textarea
            className="editor"
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder={'Catatan pendamping video, atau materi utuh kalau pelajarannya berupa tulisan.'}
            spellCheck
          />
        ) : (
          <div className="pratinjau prosa" dangerouslySetInnerHTML={{ __html: pratinjau }} />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--garis)',
          paddingTop: 22,
        }}
      >
        <button type="button" className="tombol" onClick={simpan} disabled={menyimpan}>
          {menyimpan ? 'Menyimpan…' : 'Simpan pelajaran'}
        </button>
        <button
          type="button"
          className="tombol tombol-garis"
          onClick={hapus}
          style={{ marginLeft: 'auto', borderColor: 'var(--bara)', color: 'var(--bara)' }}
        >
          Hapus
        </button>
      </div>

      {pesan && (
        <span className={buruk ? 'pesan-buruk' : 'pesan-baik'} role="status">
          {pesan}
        </span>
      )}
    </div>
  );
}
