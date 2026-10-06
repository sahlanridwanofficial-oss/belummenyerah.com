import { notFound } from 'next/navigation';
import { PUBLIC_ARTICLES_ENABLED } from '@/lib/article-visibility';

export function requirePublicArticles(): void {
  if (!PUBLIC_ARTICLES_ENABLED) notFound();
}
