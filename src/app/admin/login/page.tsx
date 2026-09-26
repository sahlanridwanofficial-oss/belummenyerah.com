'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { klienPeramban } from '@/lib/supabase/client';

function FormMasuk() {
  const router = useRouter();
  const params = useSearchParams();
  const lanjut = params.get('lanjut') || '/admin';

  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setSibuk(true);
    setGalat('');

    const { error } = await klienPeramban().auth.signInWithPassword({ email, password: sandi });

    if (error) {
      setGalat(
        error.message === 'Invalid login credentials'
          ? 'Email atau kata sandinya tidak cocok.'
          : error.message,
      );
      setSibuk(false);
      return;
    }

    router.replace(lanjut);
    router.refresh();
  }

  return (
    <form className="tumpuk tumpuk-16" onSubmit={masuk} style={{ maxWidth: 420 }}>
      <div className="medan">
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

      <div className="medan">
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
        Akun dibuat sekali lewat dasbor Supabase (Authentication → Users → Add user), lalu dipakai
        seterusnya dari sini.
      </p>
    </div>
  );
}
