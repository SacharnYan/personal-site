import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const root = path.resolve('dist');
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    const ext = path.extname(file);
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.avif': 'image/avif' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});
await new Promise(r => server.listen(4599, r));

const browser = await chromium.launch();
const errors = [];

// ===== 手机视口：notes 页 =====
const m = await browser.newPage({ viewport: { width: 375, height: 812 } });
m.on('pageerror', e => errors.push('MOBILE PAGEERROR: ' + e.message));
await m.goto('http://localhost:4599/notes/', { waitUntil: 'networkidle' });
await m.waitForTimeout(400);
const mobileTop = await m.evaluate(() => {
  const fades = [...document.querySelectorAll('[data-fade]')];
  const inView = fades.filter(el => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  return {
    htmlClass: document.documentElement.className,
    fadeTotal: fades.length,
    inViewCount: inView.length,
    inViewVisible: inView.filter(el => el.classList.contains('is-visible')).length,
    inViewOpacity1: inView.every(el => getComputedStyle(el).opacity === '1'),
  };
});
console.log('[mobile] 首屏:', JSON.stringify(mobileTop));

// 滚动到底部，途中元素应逐个显示
await m.evaluate(() => window.scrollTo({ top: document.body.scrollHeight / 2 }));
await m.waitForTimeout(500);
await m.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }));
await m.waitForTimeout(600);
const mobileEnd = await m.evaluate(() => {
  const fades = [...document.querySelectorAll('[data-fade]')];
  return { visibleAfterScroll: fades.filter(el => el.classList.contains('is-visible')).length, total: fades.length };
});
console.log('[mobile] 滚动后:', JSON.stringify(mobileEnd));

// 菜单开关
await m.click('.menu-toggle');
await m.waitForTimeout(600);
const menuOpen = await m.evaluate(() => ({
  overlayShown: !document.querySelector('.menu-overlay').hidden,
  isOpen: document.querySelector('.menu-overlay').classList.contains('is-open'),
}));
await m.click('.menu-close');
await m.waitForTimeout(600);
const menuClosed = await m.evaluate(() => document.querySelector('.menu-overlay').hidden);
console.log('[mobile] 菜单:', JSON.stringify({ ...menuOpen, closedAfterClick: menuClosed }));

// ===== 桌面视口：notes + 首页视频懒加载 =====
const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
d.on('pageerror', e => errors.push('DESKTOP PAGEERROR: ' + e.message));
await d.goto('http://localhost:4599/notes/', { waitUntil: 'networkidle' });
await d.waitForTimeout(400);
const desk = await d.evaluate(() => {
  const fades = [...document.querySelectorAll('[data-fade]')];
  const inView = fades.filter(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  return { inView: inView.length, visible: inView.filter(el => el.classList.contains('is-visible')).length };
});
console.log('[desktop] notes 首屏:', JSON.stringify(desk));

await d.goto('http://localhost:4599/', { waitUntil: 'networkidle' });
const videoBefore = await d.evaluate(() => {
  const v = document.querySelector('video[data-autoplay="visible"]');
  return v ? { hasSrc: !!v.src, hasDataSrc: !!v.dataset.src } : 'no-video';
});
await d.evaluate(() => { const v = document.querySelector('video[data-autoplay="visible"]'); if (v) v.scrollIntoView(); });
await d.waitForTimeout(1200);
const videoAfter = await d.evaluate(() => {
  const v = document.querySelector('video[data-autoplay="visible"]');
  return v ? { hasSrc: !!v.src, playing: !v.paused } : 'no-video';
});
console.log('[desktop] 首页视频: 滚动前', JSON.stringify(videoBefore), '→ 滚动后', JSON.stringify(videoAfter));

console.log('JS errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
