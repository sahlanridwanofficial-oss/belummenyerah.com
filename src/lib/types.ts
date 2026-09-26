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
