'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminReturnPath } from '@/lib/admin-return-path';
import { klienBrowser } from '@/lib/supabase/client';

function FormMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  const lanjut = adminReturnPath(params.get('lanjut'));
  const akses = params.get('akses');

  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    if (sibuk) return;
    setSibuk(true);
    setGalat('');

    try {
      const { error } = await klienBrowser().auth.signInWithPassword({ email, password: sandi });
      if (error) {
        setGalat(error.message === 'Invalid login credentials'
          ? 'Email atau kata sandinya tidak cocok.'
          : 'Belum berhasil masuk. Periksa koneksi dan coba lagi.');
        setSibuk(false);
        return;
      }
      router.replace(lanjut);
      router.refresh();
    } catch {
      setGalat('Belum berhasil masuk. Periksa koneksi dan coba lagi.');
      setSibuk(false);
    }
  }

  return (
    <form className="susun susun-16" onSubmit={masuk} aria-busy={sibuk} style={{ maxWidth: 420 }}>
      {akses === 'ditolak' && <p className="pesan-buruk" role="alert">Akun ini tidak memiliki akses redaksi. Gunakan akun pemilik situs.</p>}
      {akses === 'tidak-tersedia' && <p className="pesan-buruk" role="alert">Pemeriksaan akses belum tersedia. Coba lagi nanti.</p>}
      <div className="form-isian">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="isian"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-isian">
        <label htmlFor="sandi">Kata sandi</label>
        <input
          id="sandi"
          className="isian"
          type="password"
          autoComplete="current-password"
          required
          value={sandi}
          onChange={(e) => setSandi(e.target.value)}
        />
      </div>

      {galat && (
        <span className="pesan-buruk" role="alert">
          {galat}
        </span>
      )}

      <button type="submit" className="tombol" disabled={sibuk}>
        {sibuk ? 'Membuka…' : 'Masuk'}
      </button>
    </form>
  );
}

export default function HalamanLogin() {
  return (
    <div className="halaman" style={{ paddingBlock: 80 }}>
      <span className="kicker">Redaksi</span>
      <h1 className="judul-artikel" style={{ marginTop: 16, marginBottom: 32 }}>
        Masuk untuk menulis.
      </h1>
      <Suspense fallback={<p className="pesan-kecil">Menyiapkan…</p>}>
        <FormMasuk />
      </Suspense>
      <p className="pesan-kecil" style={{ marginTop: 24, maxWidth: 420 }}>
        Gunakan akun redaksi yang sudah diberikan pengelola situs. Halaman ini tidak menyediakan pendaftaran akun.
      </p>
    </div>
  );
}
