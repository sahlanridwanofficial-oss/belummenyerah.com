import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';
import BelumTersambung from '@/components/BelumTersambung';
import { ambilTerbit } from '@/lib/tulisan';
import { ambilKatalogRingkas, NAMA_TINGKAT } from '@/lib/kursus';
import { supabaseTerpasang } from '@/lib/supabase/server';
import { penanda, tanggalPanjang } from '@/lib/format';

const YANG_DIBAHAS = [
  {
    angka: '01',
    judul: 'Kas dan arus uang',
    isi: 'Berapa uang yang benar-benar kamu pegang bulan ini, dan berapa yang sebenarnya sudah jadi milik orang lain.',
  },
  {
    angka: '02',
    judul: 'Harga dan margin',
    isi: 'Cara menghitung harga jual supaya usaha masih hidup setelah semua biaya dibayar, bukan sekadar ikut harga tetangga.',
  },
  {
    angka: '03',
    judul: 'Dompet pribadi dan usaha',
    isi: 'Cara memisahkan uang usaha dari uang rumah tangga, dan menentukan berapa gaji yang boleh kamu ambil.',
  },
];

export default async function Beranda() {
  const tersambung = supabaseTerpasang();
  const [semua, katalog] = tersambung
    ? await Promise.all([ambilTerbit(12), ambilKatalogRingkas()])
    : [[], []];

  const utama = semua[0];
  const sisanya = semua.slice(1);

  return (
    <>
      <Masthead />

      <main id="isi">
        {!tersambung && (
          <div className="halaman">
            <BelumTersambung />
          </div>
        )}

        {tersambung && (
          <>
            <section className="halaman utama">
              <div className="dua-kolom">
                <div className="kiri">
                  {utama ? (
                    <>
                      <span className="kicker">{penanda(utama.format, utama.nomor)}</span>
                      <h1 className="judul-raksasa" style={{ marginTop: 20 }}>
                        <Link href={`/blog/${utama.slug}`}>{utama.judul}</Link>
                      </h1>
                      {utama.deck && (
                        <p className="deck" style={{ marginTop: 22, maxWidth: 640 }}>
                          {utama.deck}
                        </p>
                      )}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 26 }}
                      >
                        <span className="meta">{tanggalPanjang(utama.terbit_pada)}</span>
                        <span className="titik" />
                        <span className="meta">{utama.menit_baca} menit baca</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="kicker">Media bisnis kecil &amp; keuangan</span>
                      <h1 className="judul-raksasa" style={{ marginTop: 20, maxWidth: 760 }}>
                        Uang usaha, dijelaskan dengan bahasa manusia.
                      </h1>
                      <p className="deck" style={{ marginTop: 22, maxWidth: 620 }}>
                        Untuk kamu yang sedang melewati bulan terberat — praktis soal angka,
                        jujur soal rasanya.
                      </p>
                      <div style={{ marginTop: 30, maxWidth: 520 }}>
                        <FormLangganan
                          sumber="beranda-hero"
                          tombol="Kirim ke email saya"
                          catatan="Gratis, tanpa iklan. Berhenti kapan saja."
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="kanan">
                  <span className="label" style={{ paddingBottom: 14 }}>
                    Isi langganan
                  </span>
                  <div className="susun">
                    <span className="baris-tipis">Senin — satu tulisan utama</span>
                    <span className="baris-tipis">
                      Kamis — panduan singkat atau cerita pemilik usaha
                    </span>
                    <span
                      className="baris-tipis"
                      style={{ borderBottom: '1px solid var(--garis)' }}
                    >
                      Tanpa iklan dan tanpa tautan afiliasi
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 60 }}>
                <GarisBelum />
              </div>
            </section>

            {sisanya.length > 0 && (
              <section className="halaman seksi">
                <div className="kepala-seksi">
                  <span className="label">Tulisan sebelumnya</span>
                  <Link href="/blog" className="label tautan-lihat">
                    Lihat semua →
                  </Link>
                </div>

                {sisanya.map((t) => (
                  <article key={t.id} className="baris-arsip">
                    <div className="waktu">
                      <span className="meta">{tanggalPanjang(t.terbit_pada)}</span>
                    </div>
                    <div className="isi">
                      <Link href={`/blog/${t.slug}`} className="judul">
                        {t.judul}
                      </Link>
                      {t.deck && (
                        <p
                          style={{
                            marginTop: 10,
                            fontSize: 17,
                            lineHeight: 1.55,
                            color: 'var(--tinta-lembut)',
                            maxWidth: 620,
                          }}
                        >
                          {t.deck}
                        </p>
                      )}
                      <span className="meta" style={{ display: 'block', marginTop: 12 }}>
                        {penanda(t.format, t.nomor)} · {t.menit_baca} menit
                      </span>
                    </div>
                  </article>
                ))}
              </section>
            )}

            {/* Selama arsip masih kosong, beranda tetap menjelaskan isi situsnya. */}
            {semua.length === 0 && (
              <section className="halaman seksi">
                <div className="kepala-seksi">
                  <span className="label">Yang dibahas di sini</span>
                </div>
                <div className="kartu-kisi" style={{ marginTop: 24 }}>
                  {YANG_DIBAHAS.map((k) => (
                    <div key={k.angka} className="kartu">
                      <span className="angka-kartu">{k.angka}</span>
                      <span className="judul-kartu">{k.judul}</span>
                      <p className="isi-kartu">{k.isi}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {katalog.length > 0 && (
              <section className="halaman seksi">
                <div className="kepala-seksi">
                  <span className="label">Kursus gratis</span>
                  <Link href="/belajar" className="label tautan-lihat">
                    Lihat semua →
                  </Link>
                </div>

                {katalog.slice(0, 3).map((k) => (
                  <article key={k.id} className="baris-arsip">
                    <div className="waktu susun susun-8">
                      <span className="meta">{NAMA_TINGKAT[k.tingkat]}</span>
                      <span className="meta">
                        {k.jumlah_pelajaran} pelajaran
                        {k.total_menit > 0 ? ` · ${k.total_menit} menit` : ''}
                      </span>
                    </div>
                    <div className="isi">
                      <Link href={`/belajar/${k.slug}`} className="judul">
                        {k.judul}
                      </Link>
                      {k.deck && (
                        <p
                          style={{
                            marginTop: 10,
                            fontSize: 17,
                            lineHeight: 1.55,
                            color: 'var(--tinta-lembut)',
                            maxWidth: 620,
                          }}
                        >
                          {k.deck}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            )}

            <section className="halaman">
              <div className="kotak-langganan">
                <div>
                  <p className="judul-seksi">Satu catatan setiap Senin pagi.</p>
                  <p style={{ marginTop: 12, fontSize: 17, color: 'var(--tinta-lembut)' }}>
                    Gratis, tanpa iklan, tanpa tautan afiliasi. Berhenti kapan saja.
                  </p>
                </div>
                <FormLangganan sumber="beranda" />
              </div>
            </section>
          </>
        )}
      </main>

      <Kaki />
    </>
  );
}
