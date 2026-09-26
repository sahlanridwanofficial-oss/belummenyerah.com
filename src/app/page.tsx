import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';
import BelumTersambung from '@/components/BelumTersambung';
import { ambilTerbit } from '@/lib/tulisan';
import { ambilKatalogRingkas, NAMA_TINGKAT } from '@/lib/kursus';
import { supabaseTerpasang } from '@/lib/supabase/server';
import { TOPIK, SERI_CERITA, penanda, tanggalPanjang } from '@/lib/format';

export default async function Beranda() {
  const tersambung = supabaseTerpasang();
  const [semua, katalog] = tersambung
    ? await Promise.all([ambilTerbit(40), ambilKatalogRingkas()])
    : [[], []];

  const utama = semua[0];
  const berikutnya = semua.slice(1, 5);
  const cerita = semua.find((t) => t.format === 'wawancara' && t.id !== utama?.id);

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
                      <span className="kicker">
                        {penanda(utama.format, utama.topik, utama.nomor)}
                      </span>
                      <h1 className="judul-raksasa" style={{ marginTop: 20 }}>
                        <Link href={`/baca/${utama.slug}`}>{utama.judul}</Link>
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
                        Untuk orang yang sedang berada di bulan terberatnya — praktis soal angka,
                        jujur soal rasanya.
                      </p>
                      <div style={{ marginTop: 30, maxWidth: 520 }}>
                        <FormLangganan
                          sumber="beranda-hero"
                          tombol="Kirimi saya catatannya"
                          catatan="Gratis. Berhenti kapan saja. Tidak ada iklan."
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="kanan">
                  {berikutnya.length > 0 ? (
                    <>
                      <span className="label" style={{ paddingBottom: 14 }}>
                        Tulisan sebelumnya
                      </span>
                      <div className="daftar-ringkas">
                        {berikutnya.map((t, i) => (
                          <Link key={t.id} href={`/baca/${t.slug}`}>
                            <span className="angka">{String(i + 1).padStart(2, '0')}</span>
                            <span>{t.judul}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="label" style={{ paddingBottom: 14 }}>
                        Yang kamu terima
                      </span>
                      <div className="susun">
                        <span className="baris-tipis">Senin — satu catatan panjang</span>
                        <span className="baris-tipis">
                          Kamis — Satu Halaman, Panduan, atau Wawancara
                        </span>
                        <span
                          className="baris-tipis"
                          style={{ borderBottom: '1px solid var(--garis)' }}
                        >
                          Tidak ada iklan, tidak ada tautan afiliasi
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 60 }}>
                <GarisBelum />
              </div>
            </section>

            <section className="blok-arang">
              <div className="halaman dua-kolom">
                <div className="kiri">
                  <span className="kicker">Seri · {SERI_CERITA.judul}</span>
                  <p className="judul-seksi" style={{ marginTop: 22, maxWidth: 700 }}>
                    Pemilik usaha menceritakan bulan ketika mereka hampir berhenti — dan angka yang
                    membuat mereka bertahan.
                  </p>
                  <Link
                    href={cerita ? `/baca/${cerita.slug}` : '/cerita'}
                    style={{
                      display: 'inline-block',
                      marginTop: 28,
                      fontFamily: 'var(--sans)',
                      fontSize: 14,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: 'var(--bara-terang)',
                    }}
                  >
                    {cerita ? 'Baca yang terbaru →' : 'Lihat seri ini →'}
                  </Link>
                </div>
                <div className="kanan susun susun-16">
                  <span style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--arang-lembut)' }}>
                    Satu wawancara panjang, tanpa dipoles. Kami menanyakan angkanya, bukan cuma
                    perasaannya.
                  </span>
                  <span className="label">Terbit dua minggu sekali</span>
                </div>
              </div>
            </section>

            {katalog.length > 0 && (
              <section className="halaman" style={{ paddingTop: 62 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 20,
                    paddingBottom: 22,
                  }}
                >
                  <span className="label">Kursus gratis</span>
                  <Link href="/belajar" className="label" style={{ color: 'var(--bara)' }}>
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

            <section className="halaman" style={{ paddingTop: 62 }}>
              <span className="label" style={{ paddingBottom: 22 }}>
                Tiga topik
              </span>
              <div className="kisi-topik kisi-tiga">
                {TOPIK.map((topik) => {
                  const isi = semua.filter((t) => t.topik === topik.kode).slice(0, 2);
                  return (
                    <div key={topik.kode}>
                      <Link href={`/topik/${topik.kode}`} className="nama-topik">
                        {topik.nama}
                      </Link>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 15,
                          lineHeight: 1.5,
                          color: 'var(--meta)',
                          padding: '8px 0 16px',
                        }}
                      >
                        {topik.ringkas}
                      </span>
                      {isi.length > 0 ? (
                        isi.map((t) => (
                          <Link key={t.id} href={`/baca/${t.slug}`} className="tautan-tulisan">
                            {t.judul}
                          </Link>
                        ))
                      ) : (
                        <span
                          className="tautan-tulisan"
                          style={{ color: 'var(--abu)', fontStyle: 'italic' }}
                        >
                          “{topik.pertanyaan}”
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {utama && (
              <section className="halaman">
                <div className="kotak-langganan">
                  <div>
                    <p className="judul-seksi">Satu catatan setiap Senin pagi.</p>
                    <p style={{ marginTop: 12, fontSize: 17, color: 'var(--tinta-lembut)' }}>
                      Gratis. Berhenti kapan saja. Tidak ada iklan, tidak ada tautan afiliasi.
                    </p>
                  </div>
                  <FormLangganan sumber="beranda" />
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Kaki />
    </>
  );
}
