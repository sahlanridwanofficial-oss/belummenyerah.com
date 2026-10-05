"use client";

import { useEffect, useId, useRef, useState } from "react";

type Keadaan = "diam" | "kirim" | "berhasil" | "gagal";

export default function FormLangganan({
  sumber,
  label = "Alamat email",
  tombol = "Daftar gratis",
  catatan = "Gratis. Berhenti kapan saja.",
  kursusSlug,
  pesanBerhasil,
}: {
  sumber: string;
  label?: string;
  tombol?: string;
  catatan?: string;
  /** Kalau diisi, pendaftaran diarahkan ke kursus ini, bukan ke newsletter. */
  kursusSlug?: string;
  pesanBerhasil?: string;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [keadaan, setKeadaan] = useState<Keadaan>("diam");
  const [pesan, setPesan] = useState("");
  const [emailBermasalah, setEmailBermasalah] = useState(false);
  const keteranganId = `${id}-keterangan`;
  const konfirmasi = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (keadaan === "berhasil")
      konfirmasi.current?.focus({ preventScroll: true });
  }, [keadaan]);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (keadaan === "kirim") return;

    setKeadaan("kirim");
    setPesan("");
    setEmailBermasalah(false);

    try {
      const jawab = await fetch(
        kursusSlug ? "/api/daftar-kursus" : "/api/berlangganan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kursusSlug ? { email, slug: kursusSlug } : { email, sumber },
          ),
        },
      );
      const data = (await jawab.json()) as { pesan?: string };

      if (jawab.ok) {
        setKeadaan("berhasil");
        setPesan(
          pesanBerhasil ??
            data.pesan ??
            "Emailmu sudah terdaftar. Sampai jumpa Senin pagi.",
        );
        setEmail("");
      } else {
        setKeadaan("gagal");
        setEmailBermasalah(jawab.status === 400);
        setPesan(data.pesan ?? "Pendaftaran gagal. Coba lagi sebentar.");
      }
    } catch {
      setKeadaan("gagal");
      setPesan("Koneksi bermasalah. Periksa jaringanmu, lalu coba lagi.");
    }
  }

  if (keadaan === "berhasil") {
    return (
      <div
        ref={konfirmasi}
        className="susun susun-8 form-langganan-berhasil"
        role="status"
        tabIndex={-1}
      >
        <span className="label">Terkirim</span>
        <p style={{ fontSize: 19, lineHeight: 1.55 }}>{pesan}</p>
      </div>
    );
  }

  return (
    <form
      className="form-langganan"
      onSubmit={kirim}
      aria-busy={keadaan === "kirim"}
    >
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="form-kirim">
        <input
          id={id}
          className="isian"
          type="email"
          name="email"
          autoComplete="email"
          aria-describedby={keteranganId}
          aria-invalid={emailBermasalah || undefined}
          required
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailBermasalah(false);
          }}
        />
        <button type="submit" className="tombol" disabled={keadaan === "kirim"}>
          {keadaan === "kirim" ? "Mengirim…" : tombol}
        </button>
      </div>
      {keadaan === "gagal" ? (
        <span id={keteranganId} className="pesan-buruk" role="alert">
          {pesan}
        </span>
      ) : (
        <span id={keteranganId} className="pesan-kecil">
          {catatan}
        </span>
      )}
    </form>
  );
}
