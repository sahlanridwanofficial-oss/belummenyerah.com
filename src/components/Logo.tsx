/**
 * Tanda belummenyerah: lingkaran yang padat 68 persen, lalu sisanya
 * titik-titik. Versi melingkar dari GarisBelum, dipakai di kepala situs,
 * kaki, ikon tab, dan panel redaksi.
 */

const PUSAT = 16;
const JARI = 12;

/** Titik pada lingkaran, sudut dihitung searah jarum jam dari atas. */
function titik(derajat: number) {
  const rad = (derajat * Math.PI) / 180;
  return `${(PUSAT + JARI * Math.sin(rad)).toFixed(3)} ${(PUSAT - JARI * Math.cos(rad)).toFixed(3)}`;
}

const AKHIR_PADAT = 0.68 * 360;
const BUSUR_PADAT = `M${titik(0)} A${JARI} ${JARI} 0 1 1 ${titik(AKHIR_PADAT)}`;
const BUSUR_PUTUS = `M${titik(AKHIR_PADAT + 15)} A${JARI} ${JARI} 0 0 1 ${titik(345)}`;

export function TandaLogo({ ukuran = 28 }: { ukuran?: number }) {
  return (
    <svg
      className="tanda-logo"
      width={ukuran}
      height={ukuran}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d={BUSUR_PADAT} stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d={BUSUR_PUTUS}
        className="titik-logo"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="0 4.4"
      />
    </svg>
  );
}

export default function Logo({ ukuran = 28 }: { ukuran?: number }) {
  return (
    <span className="logo">
      <TandaLogo ukuran={ukuran} />
      <span className="wordmark">belummenyerah</span>
    </span>
  );
}
