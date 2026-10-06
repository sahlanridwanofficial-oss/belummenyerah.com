import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Kaki from "@/components/Kaki";
export const metadata: Metadata = { title: "Kredit visual" };
export default function KreditVisual() {
  return <><Masthead ajakan={false}/><main id="isi" className="halaman" style={{paddingBlock:"80px",maxWidth:"860px"}}>
    <p className="label">DI BALIK LAYAR</p><h1 className="judul-seksi" style={{marginTop:"16px",marginBottom:"32px"}}>Kenalan dengan Bekal.</h1>
    <div className="prosa"><p>Bekal adalah karakter buku kecil dengan sudut terlipat, sepatu besar, dan tas bekal. Dibuat khusus untuk Belum Menyerah sebagai teman belajar dan membangun usaha.</p><p>Bentuk tiga dimensi, ekspresi, gerak, ilustrasi cadangan, dan huruf pada beranda digambar serta disusun khusus untuk situs ini. Adegan interaktif menggunakan <a href="https://threejs.org/">Three.js</a>, perangkat lunak sumber terbuka berlisensi MIT.</p><p>Pada perangkat yang tidak mendukung WebGL atau memilih pengurangan gerak, ilustrasi diam tetap ditampilkan. Semua kelas tetap dapat diakses.</p></div>
    </main><Kaki/></>;
}
