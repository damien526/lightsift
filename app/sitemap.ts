import type { MetadataRoute } from 'next';
import { LANDING_PAGES } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    ...LANDING_PAGES.map((p) => ({
      url: `${SITE_URL}/${p.slug}/`,
      lastModified: now,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/privacy/`, lastModified: now, priority: 0.2 },
  ];
}
