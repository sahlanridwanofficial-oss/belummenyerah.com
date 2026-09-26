/** Tampil kalau variabel lingkungan Supabase belum dipasang. */
export default function BelumTersambung() {
  return (
    <div className="kosong tumpuk tumpuk-16" style={{ marginTop: 40 }}>
      <span className="label">Belum tersambung</span>
      <p style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 560 }}>
        Situsnya sudah berdiri, tapi database-nya belum dipasang. Isi{' '}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di
        pengaturan environment, lalu jalankan ulang penerapannya.
      </p>
      <p className="pesan-kecil">Langkah lengkapnya ada di README repositori ini.</p>
    </div>
  );
}
