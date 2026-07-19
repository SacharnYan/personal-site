import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST = 'C:/Users/sacha/personal-site/dist';
const PORT = 4598;
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
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
mob.on('console', m => console.log('[console]', m.text()));
await mob.goto(`http://localhost:${PORT}/snow/`, { waitUntil: 'domcontentloaded' });
await mob.waitForFunction(() => window.__snow !== undefined, null, { timeout: 20000 });
await mob.tap('#btnStart');
await mob.waitForTimeout(1200);

for (const [x, y] of [[195, 600], [195, 450], [120, 380], [300, 500]]) {
  const el = await mob.evaluate(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    return e ? (e.id || e.className || e.tagName) : 'null';
  }, [x, y]);
  const mode = await mob.evaluate(() => window.__snow.mode());
  await mob.touchscreen.tap(x, y);
  await mob.waitForTimeout(400);
  const t = await mob.evaluate(() => window.__snow.hasTarget());
  console.log(`tap(${x},${y}) 落点元素=${el} mode=${mode} target=${t}`);
}
await browser.close();
server.close();
