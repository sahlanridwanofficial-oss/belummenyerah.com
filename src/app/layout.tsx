import type { Metadata } from 'next';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import './interface.css';

const situs = process.env.NEXT_PUBLIC_SITUS_URL ?? 'https://belummenyerah.com';

export const metadata: Metadata = {
  metadataBase: new URL(situs),
  title: {
    default: 'belummenyerah · bekal belajar untuk UMKM',
    template: '%s · belummenyerah',
  },
  description:
    'Kelas online gratis untuk UMKM. Bekal bisnis dan keuangan untuk usaha yang terus tumbuh. Usaha boleh kecil. Mimpi jangan.',
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
      <body>
        <a className="lompat" href="#isi">
          Langsung ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
