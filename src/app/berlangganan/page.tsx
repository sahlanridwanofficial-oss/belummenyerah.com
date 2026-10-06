import type { Metadata } from 'next';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import FormLangganan from '@/components/FormLangganan';
export const metadata: Metadata = { title:'Kabar terbaru', description:'Info kelas baru dan bekal untuk usahamu, langsung ke email. Gratis, berhenti kapan saja.' };
export default function HalamanBerlangganan() {
  return <><Masthead/><main id="isi" className="halaman langganan-ringkas">
    <span className="kicker">KABAR BAIK, LEWAT EMAIL</span><h1>Satu bekal lagi<br/>untuk langkahmu.</h1>
    <p>Info kelas baru dan catatan untuk usahamu.<br/>Gratis, tanpa iklan. Berhenti kapan saja.</p>
    <FormLangganan sumber="halaman-berlangganan" tombol="Ikut, gratis" catatan="Berhenti kapan saja lewat tautan di setiap email."/>
    </main><Kaki/></>;
}
