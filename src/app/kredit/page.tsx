import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Kaki from "@/components/Kaki";

export const metadata: Metadata = { title: "Kredit visual" };

const MODELS = [
  { title: "Carla Rigged 001 — Rigged 3D Business Women", href: "https://sketchfab.com/3d-models/carla-rigged-001-rigged-3d-business-women-acf520f450d14dd799f98a6fede3edf5" },
  { title: "Eric Rigged 001 — Rigged 3D Business Man", href: "https://sketchfab.com/3d-models/eric-rigged-001-rigged-3d-business-man-a46bc9f67aaa415bb4f3241eef900e7f" },
  { title: "Claudia Rigged 002 — 3D Rigged Business Women", href: "https://sketchfab.com/3d-models/claudia-rigged-002-3d-rigged-business-women-c659bd0accab47c6bbe390cf822a2b92" },
];

export default function KreditVisual() {
  return <>
    <Masthead ajakan={false} />
    <main id="isi" className="halaman" style={{ paddingBlock: "80px", maxWidth: "860px" }}>
      <p className="label">DI BALIK ADEGAN</p>
      <h1 className="judul-seksi" style={{ marginTop: "16px", marginBottom: "32px" }}>Kredit visual</h1>
      <div className="prosa">
        <p>Adegan belajar, menjalankan usaha, dan berkolaborasi dibuat untuk Belum Menyerah. Figur dalam ilustrasi bukan pengajar atau peserta kelas.</p>
        <p>Model manusia dasar berikut adalah karya <a href="https://sketchfab.com/renderpeople">Renderpeople</a>, digunakan dengan lisensi <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International</a>.</p>
        <ul>{MODELS.map(model => <li key={model.href}><a href={model.href}>{model.title}</a></li>)}</ul>
        <p>Penyesuaian untuk situs ini meliputi pose dan animasi rangka, skala, komposisi adegan, pengaturan material, pencahayaan, kamera, serta optimasi berkas dan tekstur untuk web. Tekstur normal asli dipertahankan. Informasi terang-gelap dari tekstur warna dikompres dan diolah menjadi material resin dan satin bernuansa amber; warna kulit, rambut, dan pakaian fotografis tidak dipakai. Properti ruang, meja, kemasan, dan perlengkapan belajar disusun khusus untuk adegan ini.</p>
        <p>Model sumber memiliki penanda NoAI dan tidak digunakan sebagai masukan alat generasi gambar atau model. Ilustrasi cadangan merupakan render dari adegan 3D yang sama.</p>
      </div>
    </main>
    <Kaki />
  </>;
}
