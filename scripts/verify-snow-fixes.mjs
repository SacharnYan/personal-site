/* 湖心亭场景 + about 双色标题 的程序化验证（截图工具不可用时的替代方案） */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = 'C:/Users/sacha/personal-site/dist';
const PORT = 4599;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(DIST, p);
    if (p.endsWith('/') || (existsSync(f) && statSync(f).isDirectory())) f = path.join(f, 'index.html');
    if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
    const data = await readFile(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('nf');
  }
});

await new Promise(r => server.listen(PORT, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail ?? ''}`); };

/* ---------- 1. about 双色标题 ---------- */
await page.goto(`http://localhost:${PORT}/about/`, { waitUntil: 'networkidle' });
const aboutTitle = await page.evaluate(() => {
  const h1 = document.querySelector('.article-title');
  const sub = document.querySelector('.article-sub');
  if (!h1 || !sub) return null;
  return {
    h1Text: h1.textContent.trim(),
    h1Color: getComputedStyle(h1).color,
    subText: sub.textContent.trim(),
    subColor: getComputedStyle(sub).color,
  };
});
check('about 标题存在', !!aboutTitle, JSON.stringify(aboutTitle));
if (aboutTitle) {
  check('about 主标题为黑色', aboutTitle.h1Color === 'rgb(0, 0, 0)', aboutTitle.h1Color);
  check('about 副标题为灰色 #707070', aboutTitle.subColor === 'rgb(112, 112, 112)', aboutTitle.subColor);
}

/* ---------- 2. snow intro 竖排标题不折列 ---------- */
await page.goto(`http://localhost:${PORT}/snow/`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__snow !== undefined, null, { timeout: 20000 });
await page.waitForTimeout(800);
const titleBox = await page.evaluate(() => {
  const h1 = document.querySelector('#intro .vwrap h1');
  const r = h1.getBoundingClientRect();
  return { w: r.width, h: r.height, text: h1.textContent.trim() };
});
check('intro 标题为「湖心亭看雪」', titleBox.text === '湖心亭看雪', titleBox.text);
check('intro 标题单列竖排（宽<110px，高>260px）', titleBox.w < 110 && titleBox.h > 260, `w=${titleBox.w.toFixed(0)} h=${titleBox.h.toFixed(0)}`);

/* 回网站链接 */
const siteLink = await page.evaluate(() => {
  const a = document.querySelector('#ctrls a.sitelink');
  return a ? a.getAttribute('href') : null;
});
check('场景内「回网站」链接指向 /projects/snow/', siteLink === '/projects/snow/', String(siteLink));

/* ---------- 3. 进入场景，初始人数 ---------- */
await page.click('#btnStart');
await page.waitForTimeout(1200);
const p0 = await page.evaluate(() => ({ passenger: window.__snow.passengerVisible(), visitor: window.__snow.visitorVisible(), mode: window.__snow.mode() }));
check('初始 boat 模式', p0.mode === 'boat', p0.mode);
check('船上乘客可见（舟中两粒）', p0.passenger === true, String(p0.passenger));
check('亭中访客初始隐藏', p0.visitor === false, String(p0.visitor));

/* ---------- 4. 点击水面行舟 ---------- */
const before = await page.evaluate(() => window.__snow.boatPos());
/* 点画布中偏左下的水面（避开 UI 与船） */
await page.mouse.click(500, 650);
await page.waitForTimeout(300);
const hasTarget = await page.evaluate(() => window.__snow.hasTarget());
check('点击水面后生成行舟目标', hasTarget === true, String(hasTarget));
await page.waitForTimeout(3000);
const after = await page.evaluate(() => window.__snow.boatPos());
const moved = Math.hypot(after.x - before.x, after.z - before.z);
check('船向点击位置移动（3s 位移 > 2）', moved > 2, `位移 ${moved.toFixed(1)}`);

/* ---------- 5. 登亭人数变化 ---------- */
await page.evaluate(() => { window.__snow.warpTo(0, -6); window.__snow.setMode('pavilion'); });
await page.waitForTimeout(600);
const p1 = await page.evaluate(() => ({ passenger: window.__snow.passengerVisible(), visitor: window.__snow.visitorVisible(), mode: window.__snow.mode() }));
check('登亭后 mode=pavilion', p1.mode === 'pavilion', p1.mode);
check('登亭后船上乘客隐藏（余下船）', p1.passenger === false, String(p1.passenger));
check('登亭后亭中访客出现（亭上四人）', p1.visitor === true, String(p1.visitor));
await page.evaluate(() => window.__snow.setMode('boat'));
await page.waitForTimeout(600);
const p2 = await page.evaluate(() => ({ passenger: window.__snow.passengerVisible(), visitor: window.__snow.visitorVisible() }));
check('回到船上人数还原', p2.passenger === true && p2.visitor === false, JSON.stringify(p2));

/* ---------- 移动端点按 ---------- */
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await mob.goto(`http://localhost:${PORT}/snow/`, { waitUntil: 'domcontentloaded' });
await mob.waitForFunction(() => window.__snow !== undefined, null, { timeout: 20000 });
await mob.tap('#btnStart');
await mob.waitForTimeout(1000);
const mBefore = await mob.evaluate(() => window.__snow.boatPos());
await mob.touchscreen.tap(195, 450);
await mob.waitForTimeout(300);
const mTarget = await mob.evaluate(() => window.__snow.hasTarget());
await mob.waitForTimeout(6000);
const mAfter = await mob.evaluate(() => window.__snow.boatPos());
const mMoved = Math.hypot(mAfter.x - mBefore.x, mAfter.z - mBefore.z);
check('移动端点按水面生成目标并移动', mTarget === true && mMoved > 1.5, `target=${mTarget} 位移 ${mMoved.toFixed(1)}`);

const failed = results.filter(r => !r.ok).length;
console.log(`\n== ${results.length - failed}/${results.length} 项通过 ==`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
