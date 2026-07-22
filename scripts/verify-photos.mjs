import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
const root = path.resolve('dist');
const MIME = { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(root, p), (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise(r => server.listen(4595, r));
const browser = await chromium.launch();
const errors = [];
let fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));
  if (!ok) fail++;
};
const swipe = (x0, x1) => `(function (el) {
  var y = 400;
  function mk(x) { return new Touch({ identifier: 1, target: el, clientX: x, clientY: y }); }
  el.dispatchEvent(new TouchEvent('touchstart', { touches: [mk(${x0})], changedTouches: [mk(${x0})], bubbles: true, cancelable: true }));
  el.dispatchEvent(new TouchEvent('touchmove', { touches: [mk(${x1})], changedTouches: [mk(${x1})], bubbles: true, cancelable: true }));
  el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mk(${x1})], bubbles: true, cancelable: true }));
})(document.getElementById('pdCard'))`;

// ---- 桌面 ----
const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pg.on('pageerror', e => errors.push('desktop: ' + e.message));
await pg.goto('http://localhost:4595/photos/', { waitUntil: 'networkidle' });
check('网格链接数 9', await pg.evaluate(() => document.querySelectorAll('.gallery-item').length) === 9);

await pg.click('.gallery-item');
await pg.waitForTimeout(900);
const d1 = await pg.evaluate(() => ({
  url: location.pathname,
  title: document.querySelector('.pd-title')?.textContent,
  counter: document.querySelector('.pd-counter')?.textContent,
  imgOk: (() => { const im = document.querySelector('.pd-card img'); return im && im.complete && im.naturalWidth > 0 && im.getBoundingClientRect().height > 100; })(),
  steps: document.querySelectorAll('.pd-step').length,
}));
check('进入详情 01', d1.url === '/photos/01/', d1.url);
check('卡牌图加载', d1.imgOk);
check('标题', d1.title === '彩虹过城', d1.title);
check('计数器', d1.counter === '01 / 09', d1.counter);
check('底部导航两项', d1.steps === 2, 'steps=' + d1.steps);

// 键盘右键 → 02
await pg.keyboard.press('ArrowRight');
await pg.waitForTimeout(1100);
check('键盘右键到 02', await pg.evaluate(() => location.pathname) === '/photos/02/');

// 触摸左滑 → 03
await pg.evaluate(swipe(600, 380));
await pg.waitForTimeout(1200);
check('左滑到 03', await pg.evaluate(() => location.pathname) === '/photos/03/');

// 触摸右滑 → 02
await pg.evaluate(swipe(380, 600));
await pg.waitForTimeout(1200);
check('右滑回 02', await pg.evaluate(() => location.pathname) === '/photos/02/');

// 短滑不回弹翻页
await pg.evaluate(swipe(600, 570));
await pg.waitForTimeout(900);
const dShort = await pg.evaluate(() => ({ url: location.pathname, tf: document.getElementById('pdCard').style.transform }));
check('短滑停留本页', dShort.url === '/photos/02/', dShort.url);
check('短滑后卡牌回位', dShort.tf === '' || dShort.tf === 'none', dShort.tf);

// 底部文字链 → 03
await pg.click('.pd-step-r');
await pg.waitForTimeout(800);
check('底部"下一张"到 03', await pg.evaluate(() => location.pathname) === '/photos/03/');

// 返回照片墙
await pg.click('.pd-bar-link');
await pg.waitForTimeout(800);
check('返回照片墙', await pg.evaluate(() => location.pathname) === '/photos/');

// 最后一张：边界
await pg.goto('http://localhost:4595/photos/09/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(600);
const d9 = await pg.evaluate(() => ({
  dim: document.querySelector('.pd-step-dim')?.textContent,
  hasNext: !!document.getElementById('pdCard').getAttribute('data-next'),
}));
check('最后一张提示', d9.dim === '已是最后一张', d9.dim);
check('最后一张无 next', !d9.hasNext);
await pg.evaluate(swipe(600, 380));
await pg.waitForTimeout(900);
check('最后一张左滑不翻页', await pg.evaluate(() => location.pathname) === '/photos/09/');

// 截图供过目
await pg.goto('http://localhost:4595/photos/01/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1300);
await pg.screenshot({ path: 'shot-card-desktop.png' });

// ---- 手机 375 ----
const m = await browser.newPage({ viewport: { width: 375, height: 720 } });
m.on('pageerror', e => errors.push('mobile: ' + e.message));
await m.goto('http://localhost:4595/photos/05/', { waitUntil: 'networkidle' });
await m.waitForTimeout(900);
const dm = await m.evaluate(() => {
  const card = document.getElementById('pdCard').getBoundingClientRect();
  return {
    fitsWidth: card.right <= window.innerWidth + 1,
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    title: document.querySelector('.pd-title')?.textContent,
    counter: document.querySelector('.pd-counter')?.textContent,
  };
});
check('手机卡牌不超出屏幕', dm.fitsWidth && !dm.overflowX, JSON.stringify(dm));
check('手机标题计数', dm.title === '暮色' && dm.counter === '05 / 09', dm.title + ' ' + dm.counter);

// 手机上滑动翻页
await m.evaluate(swipe(300, 120));
await m.waitForTimeout(1200);
check('手机左滑到 06', await m.evaluate(() => location.pathname) === '/photos/06/');

await m.goto('http://localhost:4595/photos/08/', { waitUntil: 'networkidle' });
await m.waitForTimeout(1300);
await m.screenshot({ path: 'shot-card-mobile.png' });

check('JS 无报错', errors.length === 0, errors.join(' ; '));
await browser.close();
server.close();
process.exit(fail ? 1 : 0);
