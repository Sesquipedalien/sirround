import type { MetadataRoute } from 'next';

export const revalidate = 86400; // 24h

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://sirround.me';
  const now = new Date().toISOString();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
