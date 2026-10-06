'use client';

import Link from 'next/link';
import ArrowIcon from '@/components/ArrowIcon';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { klienBrowser } from '@/lib/supabase/client';

const MENU = [
  { href: '/admin', label: 'Arsip tulisan' },
  { href: '/admin/kursus', label: 'Kursus' },
  { href: '/admin/pelanggan', label: 'Pelanggan' },
];

/** Menandai halaman yang sedang dibuka, termasuk halaman di bawahnya. */
function sedangDibuka(jalan: string, href: string) {
  if (href === '/admin') return jalan === '/admin' || jalan.startsWith('/admin/tulis');
  return jalan === href || jalan.startsWith(`${href}/`);
}

export default function NavRedaksi() {
  const jalan = usePathname() ?? '';
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);
  const [galat, setGalat] = useState('');

  async function keluarkan() {
    if (keluar) return;
    setKeluar(true);
    setGalat('');
    try {
      const { error } = await klienBrowser().auth.signOut();
      if (error) throw error;
      router.replace('/admin/login');
      router.refresh();
    } catch {
      setGalat('Belum berhasil keluar. Periksa koneksi dan coba lagi.');
      setKeluar(false);
    }
  }

  if (jalan === '/admin/login') {
    return (
      <nav className="nav" aria-label="Menu redaksi">
        <Link href="/" target="_blank" rel="noreferrer">
          Lihat situs <ArrowIcon />
        </Link>
      </nav>
    );
  }

  return (
    <nav className="nav" aria-label="Menu redaksi">
      {MENU.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          aria-current={sedangDibuka(jalan, m.href) ? 'page' : undefined}
        >
          {m.label}
        </Link>
      ))}
      <Link href="/" target="_blank" rel="noreferrer">
        Lihat situs <ArrowIcon />
      </Link>
      <button type="button" className="tautan-keluar" onClick={keluarkan} disabled={keluar}>
        {keluar ? 'Keluar…' : 'Keluar'}
      </button>
      {galat && <span className="pesan-buruk" role="alert">{galat}</span>}
    </nav>
  );
}
