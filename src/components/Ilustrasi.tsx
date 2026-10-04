/**
 * Ilustrasi garis untuk situs publik. Garis memakai currentColor supaya
 * ikut warna teks di latar terang maupun gelap; satu detail kecil memakai
 * warna aksen lewat kelas .aksen.
 */

type Props = { ukuran?: number; className?: string };

function Bingkai({ ukuran = 120, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      className={className ? `ilustrasi ${className}` : 'ilustrasi'}
      width={ukuran}
      height={ukuran}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Mesin kas dengan laci terbuka: arus uang masuk dan keluar. */
export function Laci(props: Props) {
  return (
    <Bingkai {...props}>
      <rect x="34" y="14" width="52" height="18" />
      <path d="M44 23h20" />
      <path d="M24 32h72l6 40H18z" />
      <circle cx="40" cy="44" r="2" />
      <circle cx="52" cy="44" r="2" />
      <circle cx="64" cy="44" r="2" />
      <circle cx="40" cy="56" r="2" />
      <circle cx="52" cy="56" r="2" />
      <circle cx="64" cy="56" r="2" />
      <rect x="76" y="41" width="14" height="18" />
      <path d="M10 72h100v12H10z" />
      <path d="M14 84v22h92V84" />
      <path d="M30 84v14h22V84M58 84v14h22V84" />
      <circle className="aksen" cx="94" cy="95" r="5" />
    </Bingkai>
  );
}

/** Label harga: menentukan angka di atas kertas kecil itu. */
export function LabelHarga(props: Props) {
  return (
    <Bingkai {...props}>
      <path d="M18 18c14 0 22 8 24 20" />
      <path d="M40 34h44l22 26-22 26H40z" />
      <circle cx="52" cy="60" r="4" />
      <path d="M66 50h22" />
      <path d="M66 60h16" />
      <path className="aksen-garis" d="M66 70h24" />
      <path d="M62 102h40" />
      <path d="M62 110h26" />
    </Bingkai>
  );
}

/** Dua dompet yang dipisah: uang usaha dan uang rumah tangga. */
export function DuaDompet(props: Props) {
  return (
    <Bingkai {...props}>
      <path d="M10 40h40v50H10z" />
      <path d="M10 52h40" />
      <path d="M36 64h14v14H36z" />
      <circle cx="43" cy="71" r="2" />
      <path d="M70 40h40v50H70z" />
      <path d="M70 52h40" />
      <path d="M96 64h14v14H96z" />
      <circle className="aksen" cx="103" cy="71" r="3" />
      <path d="M60 30v70" strokeDasharray="0 6" />
      <path d="M18 30l6-10 6 10M78 30l6-10 6 10" />
    </Bingkai>
  );
}

/** Buku terbuka untuk kursus. */
export function Buku(props: Props) {
  return (
    <Bingkai {...props}>
      <path d="M60 30c-12-8-30-10-46-8v66c16-2 34 0 46 8" />
      <path d="M60 30c12-8 30-10 46-8v66c-16-2-34 0-46 8" />
      <path d="M60 30v66" />
      <path d="M24 40c8 0 16 1 26 5M24 52c8 0 16 1 26 5M24 64c8 0 16 1 26 5" />
      <path d="M70 45c10-4 18-5 26-5M70 57c10-4 18-5 26-5" />
      <path className="aksen-garis" d="M70 69c10-4 18-5 26-5" />
    </Bingkai>
  );
}

/** Warung kecil dengan tenda bergaris: untuk siapa situs ini ditulis. */
export function Warung({ ukuran = 220, className }: Props) {
  return (
    <svg
      className={className ? `ilustrasi ${className}` : 'ilustrasi'}
      width={ukuran}
      height={(ukuran * 180) / 220}
      viewBox="0 0 220 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 44h180l-10-28H30z" />
      <path d="M20 44c0 10 20 10 20 0c0 10 20 10 20 0c0 10 20 10 20 0c0 10 20 10 20 0c0 10 20 10 20 0c0 10 20 10 20 0c0 10 20 10 20 0c0 10 20 10 20 0c0 10 20 10 20 0" />
      <path className="aksen-garis" d="M60 16l-6 28M100 16l-2 28M140 16l2 28" />
      <path d="M30 56v108M190 56v108" />
      <path d="M12 164h196" />
      <path d="M44 74h76v52H44z" />
      <path d="M44 100h76" />
      <path d="M54 74v-6h12v6M72 74v-10h10v10M88 74v-6h12v6" />
      <path d="M56 100v-12h10v12M74 100v-8h14v8M94 100v-12h12v12" />
      <path d="M136 74h40v90h-40z" />
      <circle cx="168" cy="122" r="2.5" />
      <path d="M40 140h88v24H40z" />
      <path d="M58 152h20" />
      <circle className="aksen" cx="104" cy="152" r="5" />
    </svg>
  );
}
