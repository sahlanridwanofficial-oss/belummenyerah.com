import type { Metadata } from 'next';
import './globals.css';

const situs = process.env.NEXT_PUBLIC_SITUS_URL ?? 'https://belummenyerah.com';

export const metadata: Metadata = {
  metadataBase: new URL(situs),
  title: {
    default: 'belummenyerah — media bisnis kecil & keuangan',
    template: '%s — belummenyerah',
  },
  description:
    'Media edukasi bisnis kecil dan keuangan untuk orang yang sedang di titik terberatnya — praktis soal angka, jujur soal rasanya.',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'belummenyerah',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&display=swap"
        />
      </head>
      <body>
        <a className="lompat" href="#isi">
          Lompat ke isi
        </a>
        {children}
      </body>
    </html>
  );
}
