/* 六篇迁移文章的渲染验证 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = 'C:/Users/sacha/personal-site/dist';
const PORT = 4597;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(DIST, p);
    if (p.endsWith('/') || (existsSync(f) && statSync(f).isDirectory())) f = path.join(f, 'index.html');
    if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
    const data = await readFile(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let failed = 0;
const check = (name, ok, detail) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail ?? ''}`); };

/* 列表页：11 篇，按日期倒序 */
await page.goto(`http://localhost:${PORT}/writing/`, { waitUntil: 'networkidle' });
const list = await page.$$eval('.article-item', items => items.map(i => ({
  date: i.querySelector('.article-date').textContent.trim(),
  title: i.querySelector('.article-item-title').textContent.trim(),
  href: i.querySelector('a').getAttribute('href'),
})));
check('写作列表共 11 篇', list.length === 11, `实际 ${list.length}`);
const expected = ['《家园》——故事梗概', '2023 年度回顾', '三丫坡之行', '我的食粮清单', '警惕主题的碎片', '简约世界观', '夏日畅想', '探秘之旅', '花弄影', '最美的非龙', '2019 中秋归泰途中'];
check('列表顺序按日期倒序', JSON.stringify(list.map(i => i.title)) === JSON.stringify(expected), list.map(i => `${i.date} ${i.title}`).join(' | '));

/* 逐篇检查 */
const cases = [
  { slug: 'summer', h2: 5, hasCover: false, mustContain: '花有重开日，人无再少年', mustNot: ['iframe', '待续', '😄', '亚奇洛贝'] },
  { slug: 'worldview', h2: 5, hasCover: false, mustContain: '善良，那是一种选择', mustNot: ['Step1', '亚奇洛贝'] },
  { slug: 'dragon', h2: 0, hasCover: false, mustContain: '她叫理想，是最美的非龙', mustNot: ['扫一扫'] },
  { slug: 'mid-autumn-train', h2: 0, hasCover: false, mustContain: 'T152 次列车正行驶在月亮最圆的方向', mustNot: ['小姑凉'] },
  { slug: 'flower-shadow', h2: 0, hasCover: false, mustContain: '雁过留痕', mustNot: [] },
  { slug: 'sanyapo', h2: 0, hasCover: false, mustContain: '谦虚内敛，厚积薄发', mustNot: [']]>', '宇宙能量券'] },
];
for (const c of cases) {
  await page.goto(`http://localhost:${PORT}/writing/${c.slug}/`, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => ({
    title: document.querySelector('.article-title')?.textContent.trim(),
    sub: document.querySelector('.article-sub')?.textContent.trim() || null,
    h2: document.querySelectorAll('.article-body h2').length,
    cover: !!document.querySelector('.article-cover img'),
    coverOk: document.querySelector('.article-cover img')?.complete && document.querySelector('.article-cover img')?.naturalWidth > 0,
    body: document.querySelector('.article-body').textContent,
  }));
  const notHit = c.mustNot.filter(s => r.body.includes(s));
  check(`${c.slug} 正文完整`, r.body.includes(c.mustContain) && notHit.length === 0, notHit.length ? `残留: ${notHit.join(',')}` : 'ok');
  check(`${c.slug} h2 数量=${c.h2}`, r.h2 === c.h2, `实际 ${r.h2}`);
  if (c.hasCover) check(`${c.slug} cover 加载成功`, r.cover && r.coverOk, `cover=${r.cover} ok=${r.coverOk}`);
}

/* 诗的换行：两行之间应有 <br> */
await page.goto(`http://localhost:${PORT}/writing/flower-shadow/`, { waitUntil: 'networkidle' });
const brCount = await page.evaluate(() => document.querySelectorAll('.article-body p br').length);
check('花弄影诗行硬换行（br ≥ 6）', brCount >= 6, `br=${brCount}`);

/* 移动端抽一篇（home 带封面） */
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto(`http://localhost:${PORT}/writing/home/`, { waitUntil: 'networkidle' });
const mOk = await mob.evaluate(() => {
  const img = document.querySelector('.article-cover img');
  const t = document.querySelector('.article-title');
  return img && img.complete && img.naturalWidth > 0 && t && getComputedStyle(t).fontSize === '36px';
});
check('移动端封面图与标题字号', mOk === true, String(mOk));

console.log(`\n== ${failed === 0 ? '全部通过' : failed + ' 项失败'} ==`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
