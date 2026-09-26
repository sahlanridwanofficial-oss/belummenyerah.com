import { idYouTube } from '@/lib/kursus-umum';

/**
 * Video disematkan lewat youtube-nocookie, jadi YouTube tidak memasang
 * cookie pelacak sebelum peserta menekan putar.
 */
export default function PemutarVideo({ url, judul }: { url: string | null; judul: string }) {
  const id = idYouTube(url);

  if (!id) {
    if (!url) return null;
    return (
      <div className="kosong" style={{ marginBottom: 32 }}>
        <span className="label">Video tidak terbaca</span>
        <p style={{ marginTop: 8, fontSize: 16, color: 'var(--tinta-lembut)' }}>
          Tautan videonya tidak dikenali. Periksa lagi di panel redaksi.
        </p>
      </div>
    );
  }

  return (
    <div className="bingkai-video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
        title={judul}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
