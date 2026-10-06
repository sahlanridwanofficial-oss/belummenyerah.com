'use client';

export default function GalatSosial({ reset }: { reset: () => void }) {
  return <section className="halaman" style={{ paddingBlock: 48 }}><h1 className="judul-seksi">Meja konten belum bisa dimuat.</h1><p role="alert">Coba lagi untuk membaca status terbaru. Tidak ada unggahan yang dilakukan oleh halaman ini.</p><button type="button" className="tombol" onClick={reset}>Coba lagi</button></section>;
}
