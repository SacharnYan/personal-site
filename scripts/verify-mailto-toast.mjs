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
await new Promise(r => server.listen(4596, r));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, permissions: ['clipboard-read', 'clipboard-write'] });
const pg = await ctx.newPage();
const errors = [];
pg.on('pageerror', e => errors.push(e.message));
await pg.goto('http://localhost:4596/notes/', { waitUntil: 'networkidle' });

// 阻止 mailto 跳转中断测试
await pg.evaluate(() => {
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    a.addEventListener('click', e => e.preventDefault());
  });
});

// 点页脚箭头（滚动到页脚先）
await pg.evaluate(() => document.querySelector('.footer-arrow').scrollIntoView());
await pg.waitForTimeout(400);
await pg.click('.footer-arrow');
await pg.waitForTimeout(500);
const r1 = await pg.evaluate(() => ({
  toastVisible: !!document.querySelector('#site-toast.show'),
  toastText: document.getElementById('site-toast')?.textContent,
}));
console.log('点箭头后:', JSON.stringify(r1));

// 2.6 秒后应自动消失
await pg.waitForTimeout(2800);
const gone = await pg.evaluate(() => !document.querySelector('#site-toast.show'));
console.log('自动消失:', gone);

// 页脚"联系"链接触发同样行为
await pg.click('.footer-base a.footer-link[data-mail]');
await pg.waitForTimeout(400);
const r2 = await pg.evaluate(() => !!document.querySelector('#site-toast.show'));
console.log('点联系链接 toast:', r2);

// 全站其他页面也有（首页页脚箭头）
await pg.goto('http://localhost:4596/', { waitUntil: 'networkidle' });
const count = await pg.evaluate(() => document.querySelectorAll('[data-mail]').length);
console.log('首页 data-mail 链接数:', count);

console.log('JS 报错:', errors.length ? errors : '无');
await browser.close(); server.close();
