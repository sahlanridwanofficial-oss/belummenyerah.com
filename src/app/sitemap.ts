import type { MetadataRoute } from 'next';
import { ARTIKEL_BLOG } from '@/lib/blog';

// Advertise only the new curated blog. Legacy database articles stay private.
export default function sitemap(): MetadataRoute.Sitemap {
  const situs = (process.env.NEXT_PUBLIC_SITUS_URL ?? 'https://belummenyerah.com').replace(/\/+$/, '');
  return ['/', '/belajar', '/tentang', '/berlangganan', '/blog', ...ARTIKEL_BLOG.map(({ slug }) => `/blog/${slug}`)]
    .map((path) => ({ url: `${situs}${path}` }));
}
