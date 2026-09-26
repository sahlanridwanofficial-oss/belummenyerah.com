/**
 * Tanda khas belummenyerah: garis yang padat 68 persen, lalu sisanya titik-titik.
 * Belum selesai — belum menyerah.
 */
export default function GarisBelum({ lebar }: { lebar?: number | string }) {
  return (
    <div className="garis-belum" style={lebar ? { width: lebar } : undefined} aria-hidden="true">
      <span className="padat" />
      <span className="putus" />
    </div>
  );
}
