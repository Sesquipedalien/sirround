import type { MetadataRoute } from 'next';

export const revalidate = 86400; // 24h

export default function robots(): MetadataRoute.Robots {
  const base = 'https://sirround.me';
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
