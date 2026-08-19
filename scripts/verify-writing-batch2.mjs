import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = 'C:/Users/sacha/personal-site/dist';
const PORT = 4596;
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

/* 列表：10 篇，journey 在 2021 段、intake 在 2023 段 */
await page.goto(`http://localhost:${PORT}/writing/`, { waitUntil: 'networkidle' });
const list = await page.$$eval('.article-item', items => items.map(i => i.querySelector('.article-item-title').textContent.trim()));
check('写作列表共 11 篇', list.length === 11, `实际 ${list.length}`);
check('探秘之旅与食粮清单在列表中', list.includes('探秘之旅') && list.includes('我的食粮清单'), list.join(' | '));

/* journey：3 张正文图加载成功 + 代码块 + 无 emoji 残留 */
await page.goto(`http://localhost:${PORT}/writing/journey/`, { waitUntil: 'networkidle' });
const j = await page.evaluate(() => ({
  imgs: [...document.querySelectorAll('.article-body img')].map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, w: i.getBoundingClientRect().width })),
  pre: document.querySelectorAll('.article-body pre').length,
  body: document.querySelector('.article-body').textContent,
  containerW: document.querySelector('.article-body').getBoundingClientRect().width,
}));
check('journey 正文 3 张图', j.imgs.length === 3, `实际 ${j.imgs.length}`);
check('journey 图片全部加载成功', j.imgs.every(i => i.ok), j.imgs.map(i => `${i.src}:${i.ok}`).join(' '));
check('journey 图片不溢出容器', j.imgs.every(i => i.w <= j.containerW + 1), j.imgs.map(i => i.w.toFixed(0)).join(',') + ` vs ${j.containerW.toFixed(0)}`);
check('journey 代码块 ≥ 3', j.pre >= 3, `实际 ${j.pre}`);
check('journey 无残留噪声', !j.body.includes('😄') && !j.body.includes('亚奇洛贝') && !j.body.includes('iframe'), 'ok');

/* intake：链接数 + 湖心亭呼应 + 八个小节 */
await page.goto(`http://localhost:${PORT}/writing/intake/`, { waitUntil: 'networkidle' });
const k = await page.evaluate(() => ({
  h3: document.querySelectorAll('.article-body h3').length,
  links: [...document.querySelectorAll('.article-body a')].map(a => a.getAttribute('href')),
  body: document.querySelector('.article-body').textContent,
}));
check('intake 八个小节', k.h3 === 8, `实际 ${k.h3}`);
check('intake B站外链 ≥ 15', k.links.filter(h => h && h.startsWith('http')).length >= 15, `实际 ${k.links.filter(h => h && h.startsWith('http')).length}`);
check('intake 呼应湖心亭项目', k.links.includes('/projects/snow/'), 'ok');
check('intake 含关键条目', k.body.includes('张岱') && k.body.includes('何藩') && k.body.includes('纳瓦尔'), 'ok');

console.log(`\n== ${failed === 0 ? '全部通过' : failed + ' 项失败'} ==`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
