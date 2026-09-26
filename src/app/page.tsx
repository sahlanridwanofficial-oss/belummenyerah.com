import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Kaki from '@/components/Kaki';
import GarisBelum from '@/components/GarisBelum';
import FormLangganan from '@/components/FormLangganan';
import BelumTersambung from '@/components/BelumTersambung';
import { ambilTerbit } from '@/lib/tulisan';
import { supabaseTerpasang } from '@/lib/supabase/server';
import { JALUR, penanda, tanggalPanjang } from '@/lib/format';

export default async function Beranda() {
  const tersambung = supabaseTerpasang();
  const semua = tersambung ? await ambilTerbit(40) : [];

  const utama = semua[0];
  const berikutnya = semua.slice(1, 5);
  const cerita = semua.find((t) => t.jalur === 'cerita' && t.id !== utama?.id);

  return (
    <>
      <Masthead />

      <main id="isi">
        {!tersambung && (
          <div className="halaman">
            <BelumTersambung />
          </div>
        )}

        {tersambung && !utama && (
          <div className="halaman">
            <div className="kosong tumpuk tumpuk-16" style={{ marginTop: 40 }}>
              <span className="label">Belum ada terbitan</span>
              <p className="judul-seksi">Catatan pertama sedang ditulis.</p>
              <p style={{ color: 'var(--tinta-lembut)', maxWidth: 560 }}>
                Tinggalkan alamat emailmu, dan kamu akan jadi salah satu yang pertama membacanya.
              </p>
              <div style={{ maxWidth: 480, marginTop: 8 }}>
                <FormLangganan sumber="beranda-kosong" />
              </div>
            </div>
          </div>
        )}

        {utama && (
          <>
            <section className="halaman utama">
              <div className="dua-kolom">
                <div className="kiri">
                  <span className="kicker">{penanda(utama.format, utama.jalur, utama.nomor)}</span>
                  <h1 className="judul-raksasa" style={{ marginTop: 20 }}>
                    <Link href={`/catatan/${utama.slug}`}>{utama.judul}</Link>
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
                </div>

                {berikutnya.length > 0 && (
                  <div className="kanan">
                    <span className="label" style={{ paddingBottom: 14 }}>
                      Terbitan sebelumnya
                    </span>
                    <div className="daftar-ringkas">
                      {berikutnya.map((t, i) => (
                        <Link key={t.id} href={`/catatan/${t.slug}`}>
                          <span className="angka">{String(i + 1).padStart(2, '0')}</span>
                          <span>{t.judul}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 60 }}>
                <GarisBelum />
              </div>
            </section>

            <section className="blok-arang">
              <div className="halaman dua-kolom">
                <div className="kiri">
                  <span className="kicker">Seri · Hampir Nyerah</span>
                  <p className="judul-seksi" style={{ marginTop: 22, maxWidth: 700 }}>
                    Pemilik usaha menceritakan bulan ketika mereka hampir berhenti — dan angka yang
                    membuat mereka bertahan.
                  </p>
                  <Link
                    href={cerita ? `/catatan/${cerita.slug}` : '/cerita'}
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
                <div className="kanan tumpuk tumpuk-16">
                  <span style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--arang-lembut)' }}>
                    Satu wawancara panjang, tanpa dipoles. Kami tanya angkanya, bukan hanya
                    perasaannya.
                  </span>
                  <span className="label">Terbit dua mingguan</span>
                </div>
              </div>
            </section>

            <section className="halaman" style={{ paddingTop: 62 }}>
              <span className="label" style={{ paddingBottom: 22 }}>
                Empat jalur
              </span>
              <div className="kisi-jalur">
                {JALUR.map((j) => {
                  const isi = semua.filter((t) => t.jalur === j.kode).slice(0, 2);
                  return (
                    <div key={j.kode}>
                      <Link href={`/${j.kode}`} className="nama-jalur">
                        {j.nama}
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
                        {j.ringkas}
                      </span>
                      {isi.length > 0 ? (
                        isi.map((t) => (
                          <Link key={t.id} href={`/catatan/${t.slug}`} className="tautan-tulisan">
                            {t.judul}
                          </Link>
                        ))
                      ) : (
                        <span className="tautan-tulisan" style={{ color: 'var(--abu)' }}>
                          Belum ada tulisan di jalur ini.
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="halaman">
              <div className="kotak-langganan">
                <div>
                  <p className="judul-seksi">Satu catatan tiap Senin pagi.</p>
                  <p style={{ marginTop: 12, fontSize: 17, color: 'var(--tinta-lembut)' }}>
                    Gratis. Berhenti kapan saja. Tidak ada iklan, tidak ada tautan afiliasi.
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
