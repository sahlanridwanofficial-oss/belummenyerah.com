'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { buatSlug } from '@/lib/format';
import { NAMA_TINGKAT } from '@/lib/kursus-umum';
import { hapusKursus, simpanKursus, type DataKursus } from '@/app/admin/aksi-kursus';
import type { Kursus, StatusTulisan, Tingkat } from '@/lib/types';

export default function EditorKursus({ awal }: { awal?: Kursus }) {
  const router = useRouter();
  const [menyimpan, mulaiSimpan] = useTransition();

  const [judul, setJudul] = useState(awal?.judul ?? '');
  const [slug, setSlug] = useState(awal?.slug ?? '');
  const [deck, setDeck] = useState(awal?.deck ?? '');
  const [ringkasan, setRingkasan] = useState(awal?.ringkasan ?? '');
  const [untukSiapa, setUntukSiapa] = useState(awal?.untuk_siapa ?? '');
  const [tingkat, setTingkat] = useState<Tingkat>(awal?.tingkat ?? 'pemula');
  const [status, setStatus] = useState<StatusTulisan>(awal?.status ?? 'draf');
  const [penulis, setPenulis] = useState(awal?.penulis ?? 'Redaksi');
  const [urutan, setUrutan] = useState(awal ? String(awal.urutan) : '0');

  const [pesan, setPesan] = useState('');
  const [buruk, setBuruk] = useState(false);

  const slugOtomatis = useMemo(() => buatSlug(judul), [judul]);
  const slugDipakai = slug.trim() ? buatSlug(slug) : slugOtomatis;

  function simpan(statusBaru?: StatusTulisan) {
    const statusAkhir = statusBaru ?? status;
    const form: DataKursus = {
      id: awal?.id,
      judul,
      slug: slugDipakai,
      deck,
      ringkasan,
      untuk_siapa: untukSiapa,
      tingkat,
      status: statusAkhir,
      penulis,
      urutan,
    };

    mulaiSimpan(async () => {
      const hasil = await simpanKursus(form);
      setPesan(hasil.pesan);
      setBuruk(!hasil.ok);

      if (hasil.ok) {
        setStatus(statusAkhir);
        if (!awal?.id && hasil.id) router.replace(`/admin/kursus/${hasil.id}`);
        else router.refresh();
      }
    });
  }

  async function hapus() {
    if (!awal?.id) return;
    if (
      !window.confirm(
        `Hapus kursus “${awal.judul}” beserta SELURUH modul dan pelajarannya? Ini tidak bisa dibatalkan.`,
      )
    )
      return;

    const hasil = await hapusKursus(awal.id);
    if (hasil.ok) router.replace('/admin/kursus');
    else {
      setPesan(hasil.pesan);
      setBuruk(true);
    }
  }

  return (
    <div className="susun susun-28">
      <div className="form-baris">
        <div className="form-isian" style={{ flex: '3 1 320px' }}>
          <label htmlFor="judul">Judul kursus</label>
          <input
            id="judul"
            className="isian"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Membaca angka usaha kecil dari nol"
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
          placeholder="Enam pelajaran pendek untuk tahu ke mana uangmu sebenarnya pergi."
        />
      </div>

      <div className="form-baris">
        <div className="form-isian">
          <label htmlFor="tingkat">Tingkat</label>
          <select
            id="tingkat"
            className="isian"
            value={tingkat}
            onChange={(e) => setTingkat(e.target.value as Tingkat)}
          >
            {(Object.keys(NAMA_TINGKAT) as Tingkat[]).map((t) => (
              <option key={t} value={t}>
                {NAMA_TINGKAT[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-isian">
          <label htmlFor="urutan">Urutan di katalog</label>
          <input
            id="urutan"
            className="isian"
            inputMode="numeric"
            value={urutan}
            onChange={(e) => setUrutan(e.target.value)}
          />
        </div>
        <div className="form-isian">
          <label htmlFor="penulis">Disusun oleh</label>
          <input
            id="penulis"
            className="isian"
            value={penulis}
            onChange={(e) => setPenulis(e.target.value)}
          />
        </div>
      </div>

      <div className="form-isian">
        <label htmlFor="ringkasan">Ringkasan — Markdown, tampil di halaman kursus</label>
        <textarea
          id="ringkasan"
          className="editor"
          style={{ minHeight: 180 }}
          value={ringkasan}
          onChange={(e) => setRingkasan(e.target.value)}
          placeholder={'## Yang akan kamu bisa\n\n- Menghitung harga pokok sendiri\n- Membaca selisih omzet dan kas'}
        />
      </div>

      <div className="form-isian">
        <label htmlFor="untuk-siapa">Untuk siapa — Markdown, tampil di kolom samping</label>
        <textarea
          id="untuk-siapa"
          className="editor"
          style={{ minHeight: 140 }}
          value={untukSiapa}
          onChange={(e) => setUntukSiapa(e.target.value)}
          placeholder={'Pemilik usaha di tahun pertama sampai ketiga yang belum pernah menyusun laporan apa pun.'}
        />
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
        <button
          type="button"
          className="tombol tombol-garis"
          onClick={() => simpan('draf')}
          disabled={menyimpan}
        >
          {menyimpan ? 'Menyimpan…' : 'Simpan draf'}
        </button>
        <button type="button" className="tombol" onClick={() => simpan('terbit')} disabled={menyimpan}>
          {status === 'terbit' ? 'Simpan & tetap terbit' : 'Terbitkan'}
        </button>
        {awal?.id && (
          <button
            type="button"
            className="tombol tombol-garis"
            onClick={hapus}
            style={{ marginLeft: 'auto', borderColor: 'var(--bara)', color: 'var(--bara)' }}
          >
            Hapus kursus
          </button>
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
