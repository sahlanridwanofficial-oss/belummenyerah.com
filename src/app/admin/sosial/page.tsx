import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { pemilikSosial } from '@/lib/sosial/otorisasi';
import { bacaMejaSosial } from '@/lib/sosial/repository';
import MejaKonten from '@/components/sosial/MejaKonten';
import './sosial.css';

export const metadata: Metadata = { title: 'Meja konten · Redaksi', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function HalamanSosial() {
  const owner = await pemilikSosial();
  if (!owner.ok) {
    if (owner.reason === 'unauthenticated') redirect('/admin/login?lanjut=%2Fadmin%2Fsosial');
    return <section className="halaman sosial-wrap sosial-access"><span className="sosial-kicker">Meja konten</span><h1>Akses belum siap.</h1><p>{owner.reason === 'forbidden' ? 'Halaman ini khusus pemilik yang sudah diverifikasi. Tidak ada konten atau pengaturan yang dimuat.' : 'Koneksi dan verifikasi pemilik belum tersedia. Tidak ada konten atau pengaturan yang dimuat.'}</p><p className="sosial-help">Selesaikan pengamanan akses admin sebelum menggunakan meja konten.</p></section>;
  }
  let data;
  try { data = await bacaMejaSosial(owner); }
  catch {
    return <section className="halaman sosial-wrap sosial-access"><span className="sosial-kicker">Meja konten</span><h1>Penyimpanan belum bisa dibaca.</h1><p role="alert">Tabel sosial mungkin belum disiapkan atau koneksi sedang bermasalah. Muat ulang setelah penyiapan selesai. Kami belum bisa memastikan isi antrean.</p><p className="sosial-help">Tidak ada proses pembuatan atau penerbitan yang diaktifkan oleh halaman ini.</p></section>;
  }
  return <div className="halaman sosial-wrap"><header className="sosial-intro"><div><div className="sosial-kicker">Belum Menyerah · Instagram & Threads</div><h1>Satu batch. Dua kanal.</h1><p>Periksa isi sekaligus, revisi yang perlu, lalu setujui versi yang siap. Jadwal membuat konten dan jadwal menerbitkan punya kontrol sendiri.</p></div><div className="sosial-total">{data.posts.filter((post) => !post.approval).length}<span>draf perlu review</span></div></header><MejaKonten data={data} /></div>;
}
