import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
const root = path.resolve('dist');
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(root, p), (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200); res.end(data);
  });
});
await new Promise(r => server.listen(4595, r));
const browser = await chromium.launch();
const errors = [];

// 桌面：网格 → 详情 → 下一张 → 返回
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pg.on('pageerror', e => errors.push(e.message));
await pg.goto('http://localhost:4595/photos/', { waitUntil: 'networkidle' });
console.log('网格链接数:', await pg.evaluate(() => document.querySelectorAll('.gallery-item').length));
await pg.click('.gallery-item');
await pg.waitForTimeout(700);
const d1 = await pg.evaluate(() => ({
  url: location.pathname,
  title: document.querySelector('.pd-title')?.textContent,
  imgVisible: (() => { const im = document.querySelector('.pd-figure img'); return im && im.complete && im.naturalWidth > 0 && im.getBoundingClientRect().height > 100; })(),
  nextThumb: document.querySelectorAll('.pd-thumb').length,
}));
console.log('详情页(01):', JSON.stringify(d1));
await pg.click('.pd-bar-link[href*="02"]');
await pg.waitForTimeout(500);
console.log('顶部"下一张"到:', await pg.evaluate(() => location.pathname + ' | ' + document.querySelector('.pd-title')?.textContent));
await pg.click('.pd-bar-link');
await pg.waitForTimeout(500);
console.log('返回照片墙:', await pg.evaluate(() => location.pathname));

// 最后一张：无下一张
await pg.goto('http://localhost:4595/photos/09/', { waitUntil: 'networkidle' });
console.log('最后一张尾部提示:', await pg.evaluate(() => document.querySelector('.pd-bar-dim')?.textContent));

// 手机视口
const m = await browser.newPage({ viewport: { width: 375, height: 812 } });
m.on('pageerror', e => errors.push('mobile: ' + e.message));
await m.goto('http://localhost:4595/photos/05/', { waitUntil: 'networkidle' });
await m.waitForTimeout(400);
const dm = await m.evaluate(() => {
  const im = document.querySelector('.pd-figure img');
  const r = im.getBoundingClientRect();
  return { fitsWidth: r.width <= window.innerWidth, imgH: Math.round(r.height), title: document.querySelector('.pd-title')?.textContent };
});
console.log('手机端(05):', JSON.stringify(dm));

// 截图供过目
await pg.goto('http://localhost:4595/photos/01/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1200);
await pg.screenshot({ path: 'shot-detail-desktop.png' });
await m.goto('http://localhost:4595/photos/08/', { waitUntil: 'networkidle' });
await m.waitForTimeout(1200);
await m.screenshot({ path: 'shot-detail-mobile.png' });

console.log('JS 报错:', errors.length ? errors : '无');
await browser.close(); server.close();
