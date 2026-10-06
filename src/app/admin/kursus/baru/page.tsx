import { requireAdminPage } from '@/lib/admin-auth';
import EditorKursus from '@/components/EditorKursus';

export default async function KursusBaru() {
  await requireAdminPage();
  return (
    <div className="halaman" style={{ paddingBlock: 48 }}>
      <span className="kicker">Kursus baru</span>
      <h1 className="judul-seksi" style={{ marginTop: 12, marginBottom: 12 }}>
        Susun kursus baru
      </h1>
      <p className="pesan-kecil" style={{ marginBottom: 36, maxWidth: 560 }}>
        Simpan dulu keterangannya, baru modul dan pelajarannya bisa ditambahkan.
      </p>
      <EditorKursus />
    </div>
  );
}
