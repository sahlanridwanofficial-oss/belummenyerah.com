import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
import KartuKursus from '@/components/KartuKursus';
import { ambilKatalogRingkas } from '@/lib/kursus';

export const metadata: Metadata = {
  title: 'Kelas gratis',
  description: 'Bekal bisnis dan keuangan untuk UMKM. Semua kelas gratis, tanpa akun, belajar sesuai ritmemu.',
};
export default async function HalamanKursus() {
  const katalog = await ambilKatalogRingkas();
  return <><Masthead aktif="belajar"/><main id="isi" className="halaman kelas-baru">
    <div className="kelas-baru__head"><span className="kicker">KELAS GRATIS</span><h1>Ilmu baru.<br/>Langkah baru.</h1><p>Bekal bisnis dan keuangan untuk usahamu.<br/>Gratis, tanpa akun, sesuai ritmemu.</p></div>
    {katalog.length === 0 ? <div className="kelas-baru__empty">
      <span className="kelas-baru__stamp" aria-hidden="true">↗</span><div><span className="label">SEDANG DISIAPKAN</span><h2>Kelas pertama segera menyusul.</h2><p>Tinggalkan emailmu. Kami kabari saat kelas dibuka.</p><FormLangganan sumber="kursus-kosong" tombol="Kabari saya" catatan="Juga berlangganan catatan mingguan. Gratis, berhenti kapan saja."/></div>
    </div> : <div className="kartu-kursus-kisi">{katalog.map(k=><KartuKursus key={k.id} kursus={k}/>)}</div>}
    <p className="kelas-baru__note">Kemajuan belajar tersimpan hanya di perangkatmu.</p>
    </main><Kaki/></>;
}
