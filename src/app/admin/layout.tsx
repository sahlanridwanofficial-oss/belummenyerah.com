import Link from 'next/link';
import type { Metadata } from 'next';
import NavRedaksi from '@/components/NavRedaksi';

export const metadata: Metadata = {
  title: 'Redaksi',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin">
      <header className="masthead admin-bar">
        <div className="halaman masthead-isi">
          <Link href="/admin" className="wordmark" style={{ fontSize: 22 }}>
            belummenyerah
            <span
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginLeft: 12,
                color: 'var(--bara-terang)',
              }}
            >
              Redaksi
            </span>
          </Link>
          <NavRedaksi />
        </div>
      </header>
      <main id="isi">{children}</main>
    </div>
  );
}
