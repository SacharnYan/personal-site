import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
const root = path.resolve('dist');
const MIME = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(root, p), (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});
// 逐屏滚到底再回顶，触发淡入，保证整页截图完整
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));
  });
  await page.waitForTimeout(500);
}
await new Promise(r => server.listen(4596, r));
const browser = await chromium.launch();
const errors = [];
let fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));
  if (!ok) fail++;
};

// ---- 桌面 1440 ----
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pg.on('pageerror', e => errors.push(e.message));
await pg.goto('http://localhost:4596/photos/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(800);
const d = await pg.evaluate(() => {
  const g = document.querySelector('.gallery');
  const cols = getComputedStyle(g).gridTemplateColumns.split(' ').length;
  const item = document.querySelector('.gallery-item');
  const r = item.getBoundingClientRect();
  const img = item.querySelector('img').getBoundingClientRect();
  const article = document.querySelector('.article').getBoundingClientRect();
  return {
    cols,
    ratio: +(r.width / r.height).toFixed(3),
    imgCover: Math.abs(img.width - r.width) < 2 && Math.abs(img.height - r.height) < 2,
    padL: Math.round(article.left),
    padR: Math.round(window.innerWidth - article.right),
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
  };
});
check('桌面 3 列', d.cols === 3, 'cols=' + d.cols);
check('桌面 4:5 裁切', Math.abs(d.ratio - 0.8) < 0.02, 'ratio=' + d.ratio);
check('桌面 图片填满格子', d.imgCover);
check('桌面 左右留白对称', Math.abs(d.padL - d.padR) <= 2, `L=${d.padL} R=${d.padR}`);
check('桌面 无横向溢出', !d.overflowX);
await scrollThrough(pg);
await pg.screenshot({ path: 'grid-desktop.png', fullPage: true });

// ---- 手机 375 ----
const m = await browser.newPage({ viewport: { width: 375, height: 720 } });
m.on('pageerror', e => errors.push(e.message));
await m.goto('http://localhost:4596/photos/', { waitUntil: 'networkidle' });
await m.waitForTimeout(800);
const md = await m.evaluate(() => {
  const g = document.querySelector('.gallery');
  const cols = getComputedStyle(g).gridTemplateColumns.split(' ').length;
  const r = document.querySelector('.gallery-item').getBoundingClientRect();
  return {
    cols,
    ratio: +(r.width / r.height).toFixed(3),
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
  };
});
check('手机 2 列', md.cols === 2, 'cols=' + md.cols);
check('手机 4:5 裁切', Math.abs(md.ratio - 0.8) < 0.02, 'ratio=' + md.ratio);
check('手机 无横向溢出', !md.overflowX);
await scrollThrough(m);
await m.screenshot({ path: 'grid-mobile.png', fullPage: true });

check('JS 无报错', errors.length === 0, errors.join(' ; '));
await browser.close();
server.close();
process.exit(fail ? 1 : 0);
