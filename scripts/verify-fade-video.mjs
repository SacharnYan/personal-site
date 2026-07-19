/* fade 渐进增强 + 视频延迟加载 三向验证 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = 'C:/Users/sacha/personal-site/dist';
const PORT = 4595;
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
let failed = 0;
const check = (name, ok, detail) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail ?? ''}`); };

/* 1. 正常浏览器：html.js 存在、fade 动画生效、notes 18 条 */
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`http://localhost:${PORT}/notes/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => ({
    js: document.documentElement.classList.contains('js'),
    items: document.querySelectorAll('.note-item').length,
    visible: document.querySelectorAll('.note-item.is-visible').length,
    articleOp: getComputedStyle(document.querySelector('article[data-fade]')).opacity,
  }));
  check('正常浏览器 html.js 存在', r.js === true);
  check('notes 18 条渲染', r.items === 18, `实际 ${r.items}`);
  check('fade 动画生效（article opacity=1）', r.articleOp === '1', r.articleOp);
  await p.close();
}

/* 2. 禁用 JavaScript：无 html.js，但内容直接可见（noscript 兜底） */
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  await p.goto(`http://localhost:${PORT}/notes/`, { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => ({
    js: document.documentElement.classList.contains('js'),
    articleOp: getComputedStyle(document.querySelector('article[data-fade]')).opacity,
    itemOp: getComputedStyle(document.querySelectorAll('.note-item')[3]).opacity,
    text: document.querySelector('main').innerText.length,
  }));
  check('禁 JS 时无 html.js', r.js === false);
  check('禁 JS 时 article 直接可见', r.articleOp === '1', r.articleOp);
  check('禁 JS 时第 4 条(带图)可见', r.itemOp === '1', r.itemOp);
  check('禁 JS 时文本完整', r.text > 1800, `${r.text}字`);
  await p.close();
}

/* 3. 模拟老内核：拦截 HTML，强制标记脚本条件为 false、module script 不执行 */
{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p.route('**/notes/', async route => {
    const resp = await route.fetch();
    let body = await resp.text();
    body = body.replace(/'noModule' in HTMLScriptElement\.prototype/g, 'false');
    body = body.replace(/<script type="module">/g, '<script type="text/plain">');
    route.fulfill({ response: resp, body });
  });
  await p.goto(`http://localhost:${PORT}/notes/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({
    js: document.documentElement.classList.contains('js'),
    articleOp: getComputedStyle(document.querySelector('article[data-fade]')).opacity,
    text: document.querySelector('main').innerText.length,
  }));
  check('老内核模拟：不添加 html.js', r.js === false);
  check('老内核模拟：内容直接可见', r.articleOp === '1', r.articleOp);
  check('老内核模拟：文本完整', r.text > 1800, `${r.text}字`);
  await p.close();
}

/* 4. 首页视频延迟加载：打开首页时 video 无 src，网络无 mp4 请求 */
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const mp4Reqs = [];
  p.on('request', req => { if (req.url().endsWith('.mp4')) mp4Reqs.push(req.url()); });
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const r1 = await p.evaluate(() => {
    const v = document.querySelector('video.module-video');
    return { hasSrc: !!(v && v.src), hasDataSrc: !!(v && v.dataset.src), preload: v?.getAttribute('preload') };
  });
  check('首页加载后 video 无 src（未下载）', r1.hasSrc === false && r1.hasDataSrc === true, JSON.stringify(r1));
  check('首页加载后无 mp4 请求', mp4Reqs.length === 0, `${mp4Reqs.length} 个`);
  /* 滚动到视频区域，应开始加载 */
  await p.evaluate(() => document.querySelector('video.module-video')?.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(1500);
  const r2 = await p.evaluate(() => { const v = document.querySelector('video.module-video'); return { hasSrc: !!v.src, src: v.src }; });
  check('滚到视频区后 src 被赋值', r2.hasSrc === true, r2.src);
  check('滚动后产生 mp4 请求', mp4Reqs.length >= 1, `${mp4Reqs.length} 个`);
  await p.close();
}

/* 5. vlog 页 preload=none */
{
  const p = await browser.newPage();
  await p.goto(`http://localhost:${PORT}/vlog/`, { waitUntil: 'domcontentloaded' });
  const pre = await p.$$eval('video', vs => vs.map(v => v.getAttribute('preload')));
  check('vlog 页视频 preload=none', pre.every(x => x === 'none'), pre.join(','));
  await p.close();
}

console.log(`\n== ${failed === 0 ? '全部通过' : failed + ' 项失败'} ==`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
