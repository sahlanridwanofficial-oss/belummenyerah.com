'use client';

import { useId, useState } from 'react';

type Keadaan = 'diam' | 'kirim' | 'berhasil' | 'gagal';

export default function FormLangganan({
  sumber,
  label = 'Alamat email',
  tombol = 'Berlangganan',
  catatan = 'Gratis. Berhenti kapan saja.',
  kursusSlug,
  pesanBerhasil,
}: {
  sumber: string;
  label?: string;
  tombol?: string;
  catatan?: string;
  /** Kalau diisi, pendaftaran diarahkan ke kursus ini, bukan ke newsletter. */
  kursusSlug?: string;
  pesanBerhasil?: string;
}) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [keadaan, setKeadaan] = useState<Keadaan>('diam');
  const [pesan, setPesan] = useState('');

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (keadaan === 'kirim') return;

    setKeadaan('kirim');
    setPesan('');

    try {
      const jawab = await fetch(kursusSlug ? '/api/daftar-kursus' : '/api/berlangganan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kursusSlug ? { email, slug: kursusSlug } : { email, sumber }),
      });
      const data = (await jawab.json()) as { pesan?: string };

      if (jawab.ok) {
        setKeadaan('berhasil');
        setPesan(pesanBerhasil ?? data.pesan ?? 'Emailmu sudah terdaftar. Sampai jumpa Senin pagi.');
        setEmail('');
      } else {
        setKeadaan('gagal');
        setPesan(data.pesan ?? 'Pendaftaran gagal. Coba lagi sebentar.');
      }
    } catch {
      setKeadaan('gagal');
      setPesan('Koneksi bermasalah. Periksa jaringanmu, lalu coba lagi.');
    }
  }

  if (keadaan === 'berhasil') {
    return (
      <div className="susun susun-8" role="status">
        <span className="label">Terkirim</span>
        <p style={{ fontSize: 19, lineHeight: 1.55 }}>{pesan}</p>
      </div>
    );
  }

  return (
    <form className="form-langganan" onSubmit={kirim}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="form-kirim">
        <input
          id={id}
          className="isian"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="tombol" disabled={keadaan === 'kirim'}>
          {keadaan === 'kirim' ? 'Mengirim…' : tombol}
        </button>
      </div>
      {keadaan === 'gagal' ? (
        <span className="pesan-buruk" role="alert">
          {pesan}
        </span>
      ) : (
        <span className="pesan-kecil">{catatan}</span>
      )}
    </form>
  );
}
