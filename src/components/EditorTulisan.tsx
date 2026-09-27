'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { buatSlug, hitungMenitBaca, NAMA_FORMAT } from '@/lib/format';
import { hapusTulisan, simpanTulisan, type DataTulisan } from '@/app/admin/aksi';
import type { FormatTulisan, StatusTulisan, Tulisan } from '@/lib/types';

const CONTOH = `Tulis di sini pakai Markdown.

## Subjudul

Paragraf biasa. **Tebal**, *miring*, dan [tautan](https://contoh.com).

> Kutipan yang ditarik jadi besar.

- Butir pertama
- Butir kedua
`;

export default function EditorTulisan({ awal }: { awal?: Tulisan }) {
  const router = useRouter();
  const [menyimpan, mulaiSimpan] = useTransition();

  const [judul, setJudul] = useState(awal?.judul ?? '');
  const [slug, setSlug] = useState(awal?.slug ?? '');
  const [deck, setDeck] = useState(awal?.deck ?? '');
  const [isi, setIsi] = useState(awal?.isi ?? '');
  const [format, setFormat] = useState<FormatTulisan>(awal?.format ?? 'catatan');
  const [nomor, setNomor] = useState(awal?.nomor ? String(awal.nomor) : '');
  const [penulis, setPenulis] = useState(awal?.penulis ?? 'Redaksi');
  const [status, setStatus] = useState<StatusTulisan>(awal?.status ?? 'draf');

  const [tab, setTab] = useState<'tulis' | 'pratinjau'>('tulis');
  const [pesan, setPesan] = useState('');
  const [buruk, setBuruk] = useState(false);
  const [mengirim, setMengirim] = useState(false);

  const slugOtomatis = useMemo(() => buatSlug(judul), [judul]);
  const slugDipakai = slug.trim() ? buatSlug(slug) : slugOtomatis;
  const menit = hitungMenitBaca(isi);
  const pratinjau = useMemo(() => marked.parse(isi || '', { async: false }) as string, [isi]);

  function lapor(teks: string, gagal = false) {
    setPesan(teks);
    setBuruk(gagal);
  }

  function simpan(statusBaru?: StatusTulisan) {
    const statusAkhir = statusBaru ?? status;
    const form: DataTulisan = {
      id: awal?.id,
      judul,
      slug: slugDipakai,
      deck,
      isi,
      format,
      nomor,
      penulis,
      status: statusAkhir,
    };

    mulaiSimpan(async () => {
      const hasil = await simpanTulisan(form);
      lapor(hasil.pesan, !hasil.ok);

      if (hasil.ok) {
        setStatus(statusAkhir);
        if (!awal?.id && hasil.id) router.replace(`/admin/tulis/${hasil.id}`);
        else router.refresh();
      }
    });
  }

  async function hapus() {
    if (!awal?.id) return;
    if (!window.confirm(`Hapus “${awal.judul}” selamanya? Ini tidak bisa dibatalkan.`)) return;

    const hasil = await hapusTulisan(awal.id);
    if (hasil.ok) router.replace('/admin');
    else lapor(hasil.pesan, true);
  }

  async function kirimNewsletter() {
    if (!awal?.id) return;
    if (status !== 'terbit') {
      lapor('Terbitkan dulu sebelum dikirim ke pelanggan.', true);
      return;
    }
    if (!window.confirm('Kirim tulisan ini ke SEMUA pelanggan aktif sekarang?')) return;

    setMengirim(true);
    try {
      const jawab = await fetch('/api/kirim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tulisan_id: awal.id }),
      });
      const data = (await jawab.json()) as { pesan?: string };
      lapor(data.pesan ?? 'Selesai.', !jawab.ok);
    } catch {
      lapor('Gagal menghubungi pengirim email.', true);
    } finally {
      setMengirim(false);
    }
  }

  return (
    <div className="susun susun-28">
      <div className="form-baris">
        <div className="form-isian" style={{ flex: '3 1 320px' }}>
          <label htmlFor="judul">Judul</label>
          <input
            id="judul"
            className="isian"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Warung yang omzetnya naik tapi kasnya kering"
          />
        </div>
        <div className="form-isian" style={{ flex: '2 1 240px' }}>
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            className="isian"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugOtomatis || 'otomatis-dari-judul'}
          />
        </div>
      </div>

      <div className="form-isian">
        <label htmlFor="deck">Ringkasan — satu kalimat pengantar</label>
        <input
          id="deck"
          className="isian"
          value={deck}
          onChange={(e) => setDeck(e.target.value)}
          placeholder="Penjualan yang bertambah tidak selalu berarti uang bertambah."
        />
      </div>

      <div className="form-baris">
        <div className="form-isian">
          <label htmlFor="format">Format</label>
          <select
            id="format"
            className="isian"
            value={format}
            onChange={(e) => setFormat(e.target.value as FormatTulisan)}
          >
            {(Object.keys(NAMA_FORMAT) as FormatTulisan[]).map((f) => (
              <option key={f} value={f}>
                {NAMA_FORMAT[f]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-isian">
          <label htmlFor="nomor">Nomor seri</label>
          <input
            id="nomor"
            className="isian"
            inputMode="numeric"
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
            placeholder="17"
          />
        </div>
        <div className="form-isian">
          <label htmlFor="penulis">Penulis</label>
          <input
            id="penulis"
            className="isian"
            value={penulis}
            onChange={(e) => setPenulis(e.target.value)}
          />
        </div>
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
          <span className="pesan-kecil">
            {menit} menit baca · /catatan/{slugDipakai || '…'}
          </span>
        </div>

        {tab === 'tulis' ? (
          <textarea
            className="editor"
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder={CONTOH}
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
        <button type="button" className="tombol tombol-garis" onClick={() => simpan('draf')} disabled={menyimpan}>
          {menyimpan ? 'Menyimpan…' : 'Simpan draf'}
        </button>

        <button type="button" className="tombol" onClick={() => simpan('terbit')} disabled={menyimpan}>
          {status === 'terbit' ? 'Simpan & tetap terbit' : 'Terbitkan'}
        </button>

        {awal?.id && (
          <>
            <button
              type="button"
              className="tombol tombol-garis"
              onClick={kirimNewsletter}
              disabled={mengirim}
            >
              {mengirim ? 'Mengirim…' : 'Kirim ke pelanggan'}
            </button>
            <button
              type="button"
              className="tombol tombol-garis"
              onClick={hapus}
              style={{ marginLeft: 'auto', borderColor: 'var(--bara)', color: 'var(--bara)' }}
            >
              Hapus
            </button>
          </>
        )}
      </div>

      {pesan && (
        <span className={buruk ? 'pesan-buruk' : 'pesan-baik'} role="status">
          {pesan}
        </span>
      )}
    </div>
  );
}
