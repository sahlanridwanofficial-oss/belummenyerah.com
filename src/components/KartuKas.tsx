'use client';

import { useId, useState } from 'react';

type Baris = { kunci: string; label: string; awal: number };

const PEMASUKAN: Baris = {
  kunci: 'omzet',
  label: 'Omzet bulan ini',
  awal: 12_400_000,
};

const PENGELUARAN: Baris[] = [
  { kunci: 'bahan', label: 'Bahan dan barang', awal: 7_150_000 },
  { kunci: 'sewa', label: 'Sewa tempat', awal: 2_500_000 },
  { kunci: 'gaji', label: 'Gaji karyawan', awal: 2_000_000 },
  { kunci: 'listrik', label: 'Listrik, air, gas', awal: 410_000 },
];

const ribuan = new Intl.NumberFormat('id-ID');

/** Hanya angka, paling panjang 12 digit (ratusan miliar). */
function bersihkan(teks: string) {
  return teks
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 12);
}

function vonis(sisa: number, omzet: number) {
  if (omzet <= 0) return 'Isi omzetmu dulu untuk melihat sisanya.';
  if (sisa < 0) return 'Minus. Usahamu sedang dibiayai tabunganmu sendiri.';
  const persen = (sisa / omzet) * 100;
  const teks = persen.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  if (persen < 10) return `Hanya ${teks}% dari omzet. Omzet besar, sisanya tipis.`;
  if (persen < 20) return `${teks}% dari omzet. Cukup, tapi belum aman.`;
  return `${teks}% dari omzet. Sehat, pertahankan.`;
}

/**
 * Buku kas mini di beranda. Pengunjung bisa mengganti angkanya dengan
 * angka usahanya sendiri, dan sisanya langsung terhitung. Semua dihitung
 * di peramban; tidak ada yang dikirim ke mana pun.
 */
export default function KartuKas() {
  const id = useId();
  // Disimpan sebagai teks angka polos, supaya kursor tidak melompat saat
  // mengetik. Titik ribuan baru dipasang setelah kotak isian ditinggalkan.
  const [teks, setTeks] = useState<Record<string, string>>(() =>
    Object.fromEntries([PEMASUKAN, ...PENGELUARAN].map((b) => [b.kunci, String(b.awal)])),
  );
  const [aktif, setAktif] = useState<string | null>(null);
  const nilai = (kunci: string) => Number(teks[kunci] || 0);

  const omzet = nilai(PEMASUKAN.kunci);
  const keluar = PENGELUARAN.reduce((j, b) => j + nilai(b.kunci), 0);
  const sisa = omzet - keluar;
  const keadaan = sisa < 0 ? 'minus' : sisa / Math.max(omzet, 1) < 0.1 ? 'tipis' : 'sehat';

  function ubah(kunci: string, masukan: string) {
    setTeks((t) => ({ ...t, [kunci]: bersihkan(masukan) }));
  }

  function Isian({ baris, tanda }: { baris: Baris; tanda: string }) {
    return (
      <div className="kas-baris">
        <label htmlFor={`${id}-${baris.kunci}`}>
          <span className="kas-tanda" aria-hidden="true">
            {tanda}
          </span>
          {baris.label}
        </label>
        <input
          id={`${id}-${baris.kunci}`}
          inputMode="numeric"
          autoComplete="off"
          value={aktif === baris.kunci ? teks[baris.kunci] : ribuan.format(nilai(baris.kunci))}
          onChange={(e) => ubah(baris.kunci, e.target.value)}
          onFocus={(e) => {
            setAktif(baris.kunci);
            const kotak = e.target;
            requestAnimationFrame(() => kotak.select());
          }}
          onBlur={() => setAktif(null)}
        />
      </div>
    );
  }

  return (
    <div className="kas">
      <div className="kas-tumpuk">
        <div className="kas-kertas">
          <div className="kas-kepala">
            <span>Buku kas</span>
            <span>Contoh warung kopi</span>
          </div>

          {Isian({ baris: PEMASUKAN, tanda: '' })}
          <div className="kas-sekat" aria-hidden="true" />
          {PENGELUARAN.map((b) => (
            <div key={b.kunci}>{Isian({ baris: b, tanda: '−' })}</div>
          ))}

          <div className="kas-sekat tebal" aria-hidden="true" />

          <div className={`kas-sisa ${keadaan}`} aria-live="polite">
            <span>Sisa untukmu</span>
            <strong>
              {sisa < 0 ? '−' : ''}Rp {ribuan.format(Math.abs(sisa))}
            </strong>
          </div>
          <p className={`kas-vonis ${keadaan}`}>{vonis(sisa, omzet)}</p>
        </div>
      </div>
      <p className="kas-ajakan">Ganti angkanya dengan angka usahamu. Tidak ada yang tersimpan.</p>
    </div>
  );
}
