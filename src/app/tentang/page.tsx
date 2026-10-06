import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Kaki from "@/components/Kaki";
export const metadata: Metadata = { title: "Tentang", description: "Bekal belajar gratis untuk pemilik usaha yang terus melangkah." };
export default function HalamanTentang() {
  return <><Masthead aktif="tentang"/><main id="isi" className="halaman tentang-ringkas">
    <span className="kicker">KENALAN DULU</span>
    <h1>Usaha boleh kecil.<br/>Mimpi jangan.</h1>
    <div className="prosa"><p>Belum Menyerah adalah tempat belajar untuk pemilik usaha. Tentang bisnis, uang, dan langkah kecil yang bisa kamu coba hari ini.</p><p>Untuk kamu yang baru mulai, sedang berjuang, atau membangun usaha di sela pekerjaan. Kamu tidak harus tahu semuanya dari awal.</p><h2>Ilmunya gratis. Langkahnya punyamu.</h2><p>Kelas bisa dipelajari tanpa biaya dan tanpa membuat akun. Pilih yang kamu butuhkan, belajar sesuai ritmemu, lalu bawa ke usahamu.</p></div>
    <Link href="/belajar" className="giveup-button giveup-button--dark">Lihat kelas gratis <span aria-hidden="true">↗</span></Link>
    </main><Kaki/></>;
}
