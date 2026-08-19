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
await new Promise(r => server.listen(4601, r));
const browser = await chromium.launch();
const outDir = path.resolve('audit-shots');
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  ['home', '/'],
  ['home-en', '/en/'],
  ['writing', '/writing/'],
  ['writing-post', '/writing/worldview/'],
  ['shelf', '/shelf/'],
  ['shelf-detail', '/shelf/naval-almanack/'],
  ['notes', '/notes/'],
  ['photos', '/photos/'],
  ['photo-detail', '/photos/01/'],
  ['about', '/about/'],
  ['vlog', '/vlog/'],
  ['life', '/life/'],
  ['projects', '/projects/'],
  ['404', '/404.html'],
];

const consoles = [];
async function shoot(viewport, tag) {
  const pg = await browser.newPage({ viewport });
  pg.on('pageerror', e => consoles.push(`${tag} pageerror: ${e.message}`));
  pg.on('console', m => { if (m.type() === 'error') consoles.push(`${tag} console: ${m.text()}`); });
  for (const [name, url] of pages) {
    await pg.goto('http://localhost:4601' + url, { waitUntil: 'networkidle' });
    await pg.evaluate(() => { document.querySelectorAll('[data-fade]').forEach(el => el.classList.add('is-visible')); });
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(outDir, `${tag}-${name}-top.png`) });
    if (name === 'home' || name === 'writing' || name === 'shelf' || name === 'notes') {
      await pg.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.5)));
      await pg.waitForTimeout(400);
      await pg.screenshot({ path: path.join(outDir, `${tag}-${name}-mid.png`) });
      await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await pg.waitForTimeout(400);
      await pg.screenshot({ path: path.join(outDir, `${tag}-${name}-bottom.png`) });
    }
    // 打开菜单截一张（只截中文首页）
    if (name === 'home' && tag === 'desktop') {
      await pg.evaluate(() => window.scrollTo(0, 0));
      await pg.click('.menu-toggle');
      await pg.waitForTimeout(800);
      await pg.screenshot({ path: path.join(outDir, `${tag}-menu-open.png`) });
    }
  }
  await pg.close();
}

await shoot({ width: 1440, height: 900 }, 'desktop');
await shoot({ width: 390, height: 844 }, 'mobile');
console.log('shots done');
if (consoles.length) { console.log('--- console/page errors ---'); consoles.forEach(c => console.log(c)); }
else console.log('no console errors');
await browser.close();
server.close();
