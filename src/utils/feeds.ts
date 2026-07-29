import { getCollection } from 'astro:content';

const SITE = 'https://sacharn.site';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function buildWritingFeed(lang: 'zh' | 'en'): Promise<string> {
  const articles = await getCollection('writing', ({ data }) => !data.draft);
  const translations = new Map(
    (await getCollection('writing-en')).map((entry) => [entry.slug, entry]),
  );

  articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const items = articles.map((article) => {
    const translated = translations.get(article.slug);
    const source = lang === 'en' && translated ? translated : article;
    const title = lang === 'en'
      ? (source.data.title_en || source.data.title)
      : source.data.title;
    const description = lang === 'en'
      ? (source.data.description_en || source.data.description || title)
      : (source.data.description || title);
    const path = `${lang === 'en' ? '/en' : ''}/writing/${article.slug}/`;
    const url = SITE + path;

    return [
      '    <item>',
      `      <title>${escapeXml(title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${article.data.date.toUTCString()}</pubDate>`,
      `      <description>${escapeXml(description)}</description>`,
      '    </item>',
    ].join('\n');
  }).join('\n');

  const feedPath = lang === 'en' ? '/en/rss.xml' : '/rss.xml';
  const title = lang === 'en' ? 'Sacharn — Writing' : '思想名片 — 写作';
  const description = lang === 'en'
    ? 'Writing by Shucheng Yan.'
    : '严树成的文章更新。';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE}${lang === 'en' ? '/en/' : '/'}</link>
    <description>${escapeXml(description)}</description>
    <language>${lang === 'en' ? 'en' : 'zh-CN'}</language>
    <atom:link href="${SITE}${feedPath}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export const xmlResponse = (body: string) => new Response(body, {
  headers: {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  },
});
