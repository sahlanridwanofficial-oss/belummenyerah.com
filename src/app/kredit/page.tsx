import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Kaki from "@/components/Kaki";
export const metadata: Metadata = { title: "Kredit visual" };
export default function KreditVisual() {
  return <><Masthead ajakan={false}/><main id="isi" className="halaman" style={{paddingBlock:"80px",maxWidth:"860px"}}>
    <p className="label">DI BALIK ADEGAN</p><h1 className="judul-seksi" style={{marginTop:"16px",marginBottom:"32px"}}>Berat? Bareng-bareng.</h1>
    <div className="prosa"><p>Tujuh karakter saling membantu menopang satu batu besar. Tentang usaha yang terasa berat, dan langkah kecil yang lebih mungkin saat dikerjakan bersama.</p><p>Bentuk karakter, batu, pose, gerak, dan huruf pada beranda dibuat khusus untuk Belum Menyerah. Adegan interaktif menggunakan <a href="https://threejs.org/">Three.js</a>, perangkat lunak sumber terbuka berlisensi MIT. Tidak ada model karakter atau aset permainan pihak lain yang digunakan.</p><p>Pada perangkat yang tidak mendukung WebGL atau memilih pengurangan gerak, render diam dari adegan ini tetap ditampilkan. Semua kelas tetap dapat diakses.</p></div>
    </main><Kaki/></>;
}
