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
await new Promise(r => server.listen(4597, r));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader'] });
const pg = await browser.newPage({ viewport: { width: 640, height: 360 } }); // 小视口让软渲染跑快些
const errors = [];
pg.on('pageerror', e => errors.push(e.message));

await pg.goto('http://localhost:4597/snow/?shot=1&cam=pavilion', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1000);
console.log('场景就绪:', await pg.evaluate(() => !!window.__snow));

await pg.click('#btnPavilion'); // 解缆归舟 → endTimer=14
// 等结束卡出现（软渲染下游戏时间比墙钟慢，放宽等待并轮询）
let endShown = false;
for (let i = 0; i < 40 && !endShown; i++) {
  await pg.waitForTimeout(2000);
  endShown = await pg.evaluate(() => !document.getElementById('endCard').classList.contains('hidden'));
}
console.log('结束卡已显示:', endShown);

// 结束卡显示后 JS 是否仍存活
const alive = await pg.evaluate(() => new Promise(resolve => {
  let frames = 0;
  const t0 = performance.now();
  function tick() { frames++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else resolve(frames); }
  requestAnimationFrame(tick);
  setTimeout(() => resolve(-1), 5000);
}));
console.log('结束卡状态 2 秒帧数(>0 即 JS 存活):', alive);

// 点「再游一次」：应恢复渲染并回到起点
if (endShown) {
  await pg.click('#btnAgain');
  await pg.waitForTimeout(800);
  const pos = await pg.evaluate(() => window.__snow.boatPos());
  console.log('再游一次后船位(应回起点 -150,120):', JSON.stringify(pos));
}
console.log('JS 报错:', errors.length ? errors : '无');
await browser.close(); server.close();
