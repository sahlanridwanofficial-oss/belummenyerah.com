export type Jalur = 'bertahan' | 'bangun' | 'uang-pribadi' | 'cerita';
export type FormatTulisan = 'catatan' | 'satu-halaman' | 'panduan' | 'wawancara';
export type StatusTulisan = 'draf' | 'terbit';

export type Tulisan = {
  id: string;
  slug: string;
  judul: string;
  deck: string;
  isi: string;
  jalur: Jalur;
  format: FormatTulisan;
  nomor: number | null;
  penulis: string;
  status: StatusTulisan;
  menit_baca: number;
  terbit_pada: string | null;
  dibuat_pada: string;
  diubah_pada: string;
};

export type Pelanggan = {
  id: string;
  email: string;
  status: 'aktif' | 'berhenti';
  sumber: string | null;
  token: string;
  dibuat_pada: string;
  berhenti_pada: string | null;
};

export type Kiriman = {
  id: string;
  tulisan_id: string | null;
  judul: string;
  jumlah_penerima: number;
  jumlah_gagal: number;
  dikirim_pada: string;
};

export type Tingkat = 'pemula' | 'menengah' | 'lanjut';

export type Kursus = {
  id: string;
  slug: string;
  judul: string;
  deck: string;
  ringkasan: string;
  untuk_siapa: string;
  jalur: Jalur;
  tingkat: Tingkat;
  status: StatusTulisan;
  penulis: string;
  urutan: number;
  terbit_pada: string | null;
  dibuat_pada: string;
  diubah_pada: string;
};

export type Modul = {
  id: string;
  kursus_id: string;
  judul: string;
  ringkas: string;
  urutan: number;
  dibuat_pada: string;
};

export type Pelajaran = {
  id: string;
  kursus_id: string;
  modul_id: string;
  slug: string;
  judul: string;
  ringkas: string;
  isi: string;
  video_url: string | null;
  menit: number;
  urutan: number;
  dibuat_pada: string;
  diubah_pada: string;
};

export type ModulLengkap = Modul & { pelajaran: Pelajaran[] };

export type KursusLengkap = Kursus & { modul: ModulLengkap[] };
