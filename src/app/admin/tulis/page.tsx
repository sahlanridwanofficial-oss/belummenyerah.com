import EditorTulisan from '@/components/EditorTulisan';

export default function TulisBaru() {
  return (
    <div className="halaman" style={{ paddingBlock: 48 }}>
      <span className="kicker">Catatan baru</span>
      <h1 className="judul-seksi" style={{ marginTop: 12, marginBottom: 36 }}>
        Tulisan baru
      </h1>
      <EditorTulisan />
    </div>
  );
}
