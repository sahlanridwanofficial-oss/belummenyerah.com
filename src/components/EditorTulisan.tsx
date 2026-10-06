'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { buatSlug, hitungMenitBaca, NAMA_FORMAT } from '@/lib/format';
import { useBelumTersimpan } from '@/lib/belum-tersimpan';
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
  const [menghapus, setMenghapus] = useState(false);
  const sibuk = menyimpan || mengirim || menghapus;

  const sekarang = JSON.stringify([judul, slug, deck, isi, format, nomor, penulis]);
  const { belumTersimpan, tandaiTersimpan } = useBelumTersimpan(
    sekarang,
    JSON.stringify([
      awal?.judul ?? '', awal?.slug ?? '', awal?.deck ?? '', awal?.isi ?? '',
      awal?.format ?? 'catatan', awal?.nomor ? String(awal.nomor) : '', awal?.penulis ?? 'Redaksi',
    ]),
  );

  const slugOtomatis = useMemo(() => buatSlug(judul), [judul]);
  const slugDipakai = slug.trim() ? buatSlug(slug) : slugOtomatis;
  const menit = hitungMenitBaca(isi);
  const pratinjau = useMemo(() => marked.parse(isi || '', { async: false }) as string, [isi]);

  function lapor(teks: string, gagal = false) {
    setPesan(teks);
    setBuruk(gagal);
  }

  function simpan(statusBaru?: StatusTulisan) {
    if (sibuk) return;
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
      try {
        const hasil = await simpanTulisan(form);
        lapor(hasil.pesan, !hasil.ok);

        if (hasil.ok) {
          tandaiTersimpan(JSON.stringify([judul, slugDipakai, deck, isi, format, nomor, penulis]));
          setSlug(slugDipakai);
          setStatus(statusAkhir);
          if (!awal?.id && hasil.id) router.replace(`/admin/tulis/${hasil.id}`);
          else router.refresh();
        }
      } catch {
        lapor('Tulisan belum berhasil disimpan. Coba lagi; isian tetap ada.', true);
      }
    });
  }

  async function hapus() {
    if (!awal?.id || sibuk) return;
    if (!window.confirm(`Hapus “${awal.judul}” selamanya? Ini tidak bisa dibatalkan.`)) return;

    setMenghapus(true);
    try {
      const hasil = await hapusTulisan(awal.id);
      if (hasil.ok) {
        tandaiTersimpan(sekarang);
        router.replace('/admin');
      }
      else lapor(hasil.pesan, true);
    } catch {
      lapor('Tulisan belum berhasil dihapus. Coba lagi.', true);
    } finally {
      setMenghapus(false);
    }
  }

  async function kirimNewsletter() {
    if (!awal?.id || sibuk) return;
    if (belumTersimpan) {
      lapor('Simpan perubahan sebelum mengirim ke pelanggan.', true);
      return;
    }
    if (status !== 'terbit') {
      lapor('Tandai tulisan siap dikirim terlebih dahulu.', true);
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
    <div className="susun susun-28" aria-busy={sibuk}>
      <aside className="admin-catatan">
        Arsip untuk newsletter. Penyimpanan di sini tidak mengubah blog publik, yang saat ini dikelola melalui kode situs. Menandai siap dikirim belum mengirim email.
      </aside>
      <div className="form-baris">
        <div className="form-isian" style={{ flex: '3 1 320px' }}>
          <label htmlFor="judul">Judul</label>
          <input
            id="judul"
            className="isian"
            disabled={sibuk}
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
            disabled={sibuk}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugOtomatis || 'otomatis-dari-judul'}
          />
        </div>
      </div>

      <div className="form-isian">
        <label htmlFor="deck">Ringkasan: satu kalimat pengantar</label>
        <input
          id="deck"
          className="isian"
            disabled={sibuk}
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
            disabled={sibuk}
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
            disabled={sibuk}
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
            disabled={sibuk}
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
            {menit} menit baca · Slug arsip: {slugDipakai || '…'}
          </span>
        </div>

        {tab === 'tulis' ? (
          <textarea
            className="editor"
            disabled={sibuk}
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
        <button type="button" className="tombol tombol-garis" onClick={() => simpan('draf')} disabled={sibuk}>
          {menyimpan ? 'Menyimpan…' : 'Simpan draf'}
        </button>

        {belumTersimpan && !menyimpan && (
          <span className="tanda-belum-simpan">Ada perubahan yang belum disimpan</span>
        )}

        <button type="button" className="tombol" onClick={() => simpan('terbit')} disabled={sibuk}>
          {status === 'terbit' ? 'Simpan & tetap siap dikirim' : 'Simpan & siap dikirim'}
        </button>

        {awal?.id && (
          <>
            <button
              type="button"
              className="tombol tombol-garis"
              onClick={kirimNewsletter}
              disabled={sibuk || belumTersimpan || status !== 'terbit'}
            >
              {mengirim ? 'Mengirim…' : 'Kirim ke pelanggan'}
            </button>
            <button
              type="button"
              className="tombol tombol-garis"
              onClick={hapus}
              disabled={sibuk}
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
