'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { klienBrowser } from '@/lib/supabase/client';

const MENU = [
  { href: '/admin', label: 'Tulisan' },
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

  async function keluarkan() {
    setKeluar(true);
    await klienBrowser().auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  if (jalan === '/admin/login') {
    return (
      <nav className="nav" aria-label="Menu redaksi">
        <Link href="/" target="_blank" rel="noreferrer">
          Lihat situs ↗
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
        Lihat situs ↗
      </Link>
      <button type="button" className="tautan-keluar" onClick={keluarkan} disabled={keluar}>
        {keluar ? 'Keluar…' : 'Keluar'}
      </button>
    </nav>
  );
}
