import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import photos from '../data/photos.json';

const SITE = 'https://sacharn.site';
const staticPaths = [
  '/',
  '/about/',
  '/projects/',
  '/projects/floral/',
  '/projects/snow/',
  '/writing/',
  '/shelf/',
  '/notes/',
  '/photos/',
  '/vlog/',
  '/life/',
];

const escapeXml = (value: string) => value.replaceAll('&', '&amp;');

export const GET: APIRoute = async () => {
  const articles = await getCollection('writing', ({ data }) => !data.draft);
  const contentPaths = [
    ...articles.map((article) => `/writing/${article.slug}/`),
    ...photos.map((photo) => `/photos/${photo.id}/`),
  ];
  const paths = [...staticPaths, ...contentPaths];
  const urls = [...paths, ...paths.map((path) => `/en${path}`), '/snow/']
    .map((path) => `  <url><loc>${escapeXml(SITE + path)}</loc></url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
};
