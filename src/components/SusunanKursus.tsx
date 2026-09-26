'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  hapusModul,
  hapusPelajaran,
  simpanModul,
  tambahModul,
  tambahPelajaran,
} from '@/app/admin/aksi-kursus';
import type { ModulLengkap } from '@/lib/types';

export default function SusunanKursus({
  kursusId,
  modul,
}: {
  kursusId: string;
  modul: ModulLengkap[];
}) {
  const router = useRouter();
  const [sibuk, mulai] = useTransition();
  const [judulModulBaru, setJudulModulBaru] = useState('');
  const [pesan, setPesan] = useState('');
  const [buruk, setBuruk] = useState(false);

  function lapor(teks: string, gagal = false) {
    setPesan(teks);
    setBuruk(gagal);
    if (!gagal) router.refresh();
  }

  function buatModul() {
    if (!judulModulBaru.trim()) return;
    mulai(async () => {
      const hasil = await tambahModul(kursusId, judulModulBaru, modul.length);
      if (hasil.ok) setJudulModulBaru('');
      lapor(hasil.pesan, !hasil.ok);
    });
  }

  return (
    <div className="susun susun-28">
      {modul.length === 0 && (
        <div className="kosong">
          <span className="label">Belum ada modul</span>
          <p style={{ marginTop: 10, color: 'var(--tinta-lembut)', maxWidth: 520 }}>
            Modul itu bab. Pelajaran itu halamannya. Mulai dengan satu modul, misalnya “Melihat
            uangmu apa adanya”.
          </p>
        </div>
      )}

      {modul.map((m, i) => (
        <BarisModul key={m.id} modul={m} nomor={i + 1} kursusId={kursusId} onKabar={lapor} />
      ))}

      <div
        className="form-baris"
        style={{ borderTop: '1px solid var(--tinta)', paddingTop: 22, alignItems: 'flex-end' }}
      >
        <div className="form-isian" style={{ flex: '1 1 320px' }}>
          <label htmlFor="modul-baru">Modul baru</label>
          <input
            id="modul-baru"
            className="isian"
            value={judulModulBaru}
            onChange={(e) => setJudulModulBaru(e.target.value)}
            placeholder="Melihat uangmu apa adanya"
          />
        </div>
        <button type="button" className="tombol" onClick={buatModul} disabled={sibuk}>
          Tambah modul
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

function BarisModul({
  modul,
  nomor,
  kursusId,
  onKabar,
}: {
  modul: ModulLengkap;
  nomor: number;
  kursusId: string;
  onKabar: (teks: string, gagal?: boolean) => void;
}) {
  const [sibuk, mulai] = useTransition();
  const [judul, setJudul] = useState(modul.judul);
  const [ringkas, setRingkas] = useState(modul.ringkas);
  const [urutan, setUrutan] = useState(String(modul.urutan));
  const [judulPelajaranBaru, setJudulPelajaranBaru] = useState('');

  function simpan() {
    mulai(async () => {
      const angka = Number.parseInt(urutan, 10);
      const hasil = await simpanModul(modul.id, judul, ringkas, Number.isNaN(angka) ? 0 : angka);
      onKabar(hasil.pesan, !hasil.ok);
    });
  }

  function hapus() {
    if (!window.confirm(`Hapus modul “${modul.judul}” beserta ${modul.pelajaran.length} pelajarannya?`))
      return;
    mulai(async () => {
      const hasil = await hapusModul(modul.id);
      onKabar(hasil.pesan, !hasil.ok);
    });
  }

  function buatPelajaran() {
    if (!judulPelajaranBaru.trim()) return;
    mulai(async () => {
      const hasil = await tambahPelajaran(
        kursusId,
        modul.id,
        judulPelajaranBaru,
        modul.pelajaran.length,
      );
      if (hasil.ok) setJudulPelajaranBaru('');
      onKabar(hasil.pesan, !hasil.ok);
    });
  }

  function buangPelajaran(id: string, nama: string) {
    if (!window.confirm(`Hapus pelajaran “${nama}”?`)) return;
    mulai(async () => {
      const hasil = await hapusPelajaran(id);
      onKabar(hasil.pesan, !hasil.ok);
    });
  }

  return (
    <div style={{ border: '1px solid var(--garis)', padding: '22px 24px' }}>
      <div className="form-baris" style={{ alignItems: 'flex-end' }}>
        <div className="form-isian" style={{ flex: '0 0 70px' }}>
          <label htmlFor={`urutan-${modul.id}`}>Urutan</label>
          <input
            id={`urutan-${modul.id}`}
            className="isian"
            inputMode="numeric"
            value={urutan}
            onChange={(e) => setUrutan(e.target.value)}
          />
        </div>
        <div className="form-isian" style={{ flex: '2 1 260px' }}>
          <label htmlFor={`judul-${modul.id}`}>Modul {nomor}</label>
          <input
            id={`judul-${modul.id}`}
            className="isian"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
          />
        </div>
        <div className="form-isian" style={{ flex: '3 1 300px' }}>
          <label htmlFor={`ringkas-${modul.id}`}>Keterangan singkat</label>
          <input
            id={`ringkas-${modul.id}`}
            className="isian"
            value={ringkas}
            onChange={(e) => setRingkas(e.target.value)}
          />
        </div>
        <button type="button" className="tombol tombol-garis" onClick={simpan} disabled={sibuk}>
          Simpan
        </button>
        <button
          type="button"
          className="tombol tombol-garis"
          onClick={hapus}
          disabled={sibuk}
          style={{ borderColor: 'var(--bara)', color: 'var(--bara)' }}
        >
          Hapus
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        {modul.pelajaran.map((p) => (
          <div key={p.id} className="baris-pelajaran">
            <Link href={`/admin/kursus/${kursusId}/pelajaran/${p.id}`} className="nama">
              {p.judul}
            </Link>
            <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="meta" style={{ whiteSpace: 'nowrap' }}>
                {p.video_url ? 'Video' : 'Tulisan'}
                {p.menit > 0 ? ` · ${p.menit} mnt` : ''}
                {p.isi.trim() || p.video_url ? '' : ' · kosong'}
              </span>
              <button
                type="button"
                onClick={() => buangPelajaran(p.id, p.judul)}
                disabled={sibuk}
                aria-label={`Hapus pelajaran ${p.judul}`}
                style={{
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--bara)',
                  fontFamily: 'var(--sans)',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Hapus
              </button>
            </span>
          </div>
        ))}

        <div className="form-baris" style={{ marginTop: 16, alignItems: 'flex-end' }}>
          <div className="form-isian" style={{ flex: '1 1 280px' }}>
            <label htmlFor={`pelajaran-baru-${modul.id}`}>Pelajaran baru</label>
            <input
              id={`pelajaran-baru-${modul.id}`}
              className="isian"
              value={judulPelajaranBaru}
              onChange={(e) => setJudulPelajaranBaru(e.target.value)}
              placeholder="Memisahkan dompet pribadi dan dompet usaha"
            />
          </div>
          <button
            type="button"
            className="tombol tombol-garis"
            onClick={buatPelajaran}
            disabled={sibuk}
          >
            Tambah pelajaran
          </button>
        </div>
      </div>
    </div>
  );
}
