import type { MetadataRoute } from 'next';

// Only currently available public destinations belong here. Article content is
// preserved privately, but must not be queried or advertised in the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const situs = (process.env.NEXT_PUBLIC_SITUS_URL ?? 'https://belummenyerah.com').replace(/\/+$/, '');

  return ['/', '/belajar', '/tentang', '/berlangganan'].map((path) => ({
    url: `${situs}${path}`,
  }));
}
