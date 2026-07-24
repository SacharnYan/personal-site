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
await new Promise(r => server.listen(4597, r));
const browser = await chromium.launch();
const errors = [];
let fail = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));
  if (!ok) fail++;
};
const hasCJK = (s) => /[\u4e00-\u9fff]/.test(s || '');

// 所有应有双语镜像的静态路径（动态页抽查代表）
const ZH_PATHS = ['/', '/about/', '/projects/', '/projects/snow/', '/projects/floral/', '/writing/', '/notes/', '/photos/', '/vlog/', '/life/'];
const enPath = (p) => (p === '/' ? '/en/' : '/en' + p);

const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pg.on('pageerror', e => errors.push('desktop: ' + e.message));

// 1) 每个中文路径都有英文镜像，且英文页 html lang="en"
for (const p of ZH_PATHS) {
  const r1 = await pg.request.get('http://localhost:4597' + p);
  const r2 = await pg.request.get('http://localhost:4597' + enPath(p));
  check(`镜像存在 ${p} ↔ ${enPath(p)}`, r1.status() === 200 && r2.status() === 200, `${r1.status()}/${r2.status()}`);
  const html = await r2.text();
  check(`英文页 lang="en" ${enPath(p)}`, html.includes('lang="en"'));
}

// 2) 英文首页：Hero/卡片/菜单/页脚全英文，无中文界面字
await pg.goto('http://localhost:4597/en/', { waitUntil: 'networkidle' });
const enHome = await pg.evaluate(() => ({
  hero: document.querySelector('.hero-title')?.textContent,
  heroSub: document.querySelector('.hero-subtitle')?.textContent,
  nav: [...document.querySelectorAll('.menu-link')].map(a => a.textContent),
  foot: document.querySelector('.footer-news-text')?.textContent,
  copy: document.querySelector('.footer-copy')?.textContent,
  firstCard: document.querySelector('.module-title')?.textContent,
  cta: document.querySelector('.module-cta')?.textContent?.trim(),
}));
check('EN 首页 Hero', enHome.hero === 'Learn always. Create with care. Express freely.', enHome.hero);
check('EN 首页副题', enHome.heroSub === 'The leopard transforms; his coat grows splendid.', enHome.heroSub);
check('EN 菜单五项英文', enHome.nav.join(',') === 'Projects,Writing,Notes,Photos,Vlog', enHome.nav.join(','));
check('EN 页脚订阅文案', !hasCJK(enHome.foot), enHome.foot?.slice(0, 30));
check('EN 署名', enHome.copy?.includes('Shucheng Yan'), enHome.copy);
check('EN 首页第一张卡', enHome.firstCard === 'Snow at Huxin Pavilion', enHome.firstCard);
check('EN 卡片 CTA', enHome.cta === 'Enter the scene', enHome.cta);

// 3) 语言切换：中文页菜单有 EN 链到 /en/ 同路径；英文页有 中文 链回
await pg.goto('http://localhost:4597/photos/01/', { waitUntil: 'networkidle' });
const sw1 = await pg.evaluate(() => document.querySelector('.menu-lang')?.getAttribute('href'));
check('中文页切换链接 → /en/photos/01/', sw1 === '/en/photos/01/', sw1);
await pg.goto('http://localhost:4597/en/photos/01/', { waitUntil: 'networkidle' });
const sw2 = await pg.evaluate(() => ({
  href: document.querySelector('.menu-lang')?.getAttribute('href'),
  label: document.querySelector('.menu-lang')?.textContent,
}));
check('英文页切换链接 → /photos/01/', sw2.href === '/photos/01/', sw2.href);
check('英文页切换标签是中文', sw2.label === '中文', sw2.label);

// 4) 英文照片详情：英文标题/提示语/计数器
const enPd = await pg.evaluate(() => ({
  title: document.querySelector('.pd-title')?.textContent,
  back: document.querySelector('.pd-bar-link')?.textContent,
  counter: document.querySelector('.pd-counter')?.textContent,
  next: document.querySelector('.pd-step-r')?.textContent,
}));
check('EN 照片标题', enPd.title === 'Rainbow over the City', enPd.title);
check('EN 返回文案', enPd.back === '← All photos', enPd.back);
check('EN 计数器', enPd.counter === '01 / 09', enPd.counter);
check('EN 下一张', enPd.next === 'Bamboo Raft on the River ›', enPd.next);

// 5) hreflang 互指
const hreflang = await pg.evaluate(() => [...document.querySelectorAll('link[hreflang]')].map(l => l.getAttribute('hreflang') + ':' + l.getAttribute('href')));
check('hreflang 三条', hreflang.length === 3, hreflang.join(' | '));
check('hreflang zh 指向中文版', hreflang.some(h => h.startsWith('zh-CN:') && h.endsWith('/photos/01/')), hreflang.find(h => h.startsWith('zh')) || '');
check('hreflang en 指向英文版', hreflang.some(h => h.startsWith('en:') && h.includes('/en/photos/01/')), hreflang.find(h => h.startsWith('en:')) || '');

// 6) 英文写作列表：11 篇全部已译，不再出现 In Chinese 徽标
await pg.goto('http://localhost:4597/en/writing/', { waitUntil: 'networkidle' });
const enW = await pg.evaluate(() => {
  const items = [...document.querySelectorAll('.article-item')];
  return {
    first: items[0]?.querySelector('.article-item-title a')?.textContent?.trim(),
    badges: document.querySelectorAll('.article-badge').length,
    count: items.length,
    date: document.querySelector('.article-date')?.textContent,
  };
});
check('EN 写作列表 11 篇', enW.count === 11, 'count=' + enW.count);
check('EN 写作首篇英译标题', enW.first === 'Home — A Synopsis', enW.first);
check('EN 写作列表无徽标（全部已译）', enW.badges === 0, 'badges=' + enW.badges);
check('EN 日期格式', /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(enW.date || ''), enW.date);

// 7) 英文写作详情：11 篇全部直接渲染英文正文，无提示条、无中文残留
const SLUGS = ['home', 'review-2023', 'sanyapo', 'intake', 'fragments', 'worldview', 'summer', 'journey', 'flower-shadow', 'dragon', 'mid-autumn-train'];
for (const slug of SLUGS) {
  await pg.goto(`http://localhost:4597/en/writing/${slug}/`, { waitUntil: 'networkidle' });
  const enPost = await pg.evaluate(() => ({
    notice: document.querySelector('.article-notice') !== null,
    bodyCJK: /[\u4e00-\u9fff]/.test(document.querySelector('.article-body')?.textContent || ''),
    empty: (document.querySelector('.article-body')?.textContent || '').trim().length < 200,
  }));
  check(`EN 已译 /${slug}/ 无提示条、正文全英文且非空`, !enPost.notice && !enPost.bodyCJK && !enPost.empty,
    `notice=${enPost.notice} cjk=${enPost.bodyCJK} empty=${enPost.empty}`);
}

// 8) 中文页不受污染：首页 Hero 仍中文，无 English 界面字
await pg.goto('http://localhost:4597/', { waitUntil: 'networkidle' });
const zhHome = await pg.evaluate(() => ({
  hero: document.querySelector('.hero-title')?.textContent,
  foot: document.querySelector('.footer-news-text')?.textContent,
  copy: document.querySelector('.footer-copy')?.textContent,
}));
check('中文首页 Hero 不变', zhHome.hero === '终身学习，认真创造，自由表达。', zhHome.hero);
check('中文页脚不变', zhHome.foot === '订阅更新。有新项目或文章时，我会写邮件告诉你。', zhHome.foot);
check('中文署名不变', zhHome.copy?.includes('严树成'), zhHome.copy);

// 9) 英文关于页：时间线英译
await pg.goto('http://localhost:4597/en/about/', { waitUntil: 'networkidle' });
const enAbout = await pg.evaluate(() => ({
  intro: document.querySelector('.article-body > p')?.textContent?.trim(),
  stage: document.querySelector('.timeline-stage')?.textContent,
  place: document.querySelector('.timeline-place')?.textContent,
}));
check('EN 关于开头', (enAbout.intro || '').startsWith("I'm Shucheng Yan"), enAbout.intro?.slice(0, 40));
check('EN 时间线首条', enAbout.stage === 'Work' && enAbout.place === 'Huawei Device BG · Retail Product', enAbout.stage + ' | ' + enAbout.place);

// 10) 英文随记：19 条全译、提示条撤下、英文日期、无中文残留；中文页不受污染
const notesData = JSON.parse(fs.readFileSync('src/data/notes.json', 'utf8'));
check('notes.json 每条都有 text_en', notesData.every(n => typeof n.text_en === 'string' && n.text_en.length > 10), `${notesData.filter(n => !n.text_en).length} 条缺失`);
await pg.goto('http://localhost:4597/en/notes/', { waitUntil: 'networkidle' });
const enNotes = await pg.evaluate(() => ({
  notice: document.querySelector('.article-notice')?.textContent || null,
  firstDate: document.querySelector('.note-date')?.textContent,
  count: document.querySelectorAll('.note-item').length,
  bodyCJK: /[\u4e00-\u9fff]/.test([...document.querySelectorAll('.note-text')].map(n => n.textContent).join('')),
}));
check('EN 随记 19 条', enNotes.count === 19, 'count=' + enNotes.count);
check('EN 随记提示条已撤', enNotes.notice === null, String(enNotes.notice));
check('EN 随记英文日期', enNotes.firstDate === 'Jan 8, 2026', enNotes.firstDate);
check('EN 随记无中文残留', !enNotes.bodyCJK);
await pg.goto('http://localhost:4597/notes/', { waitUntil: 'networkidle' });
const zhNotes = await pg.evaluate(() => ({
  notice: document.querySelector('.article-notice')?.textContent || null,
  bodyCJK: /[\u4e00-\u9fff]/.test(document.querySelector('.note-text')?.textContent || ''),
}));
check('中文随记仍是中文且无提示条', zhNotes.bodyCJK && zhNotes.notice === null);

// 11) 英文 404（Astro 将非根 404 输出为目录形式）
const r404 = await pg.request.get('http://localhost:4597/en/404/');
const t404 = await r404.text();
check('EN 404 存在且英文', r404.status() === 200 && t404.includes('Page not found'));

// 12) 语言自动识别：首访按浏览器语言跳镜像（只跳一次）；手动选择被记住
const ctxEn = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 900 } });
const pEn = await ctxEn.newPage();
await pEn.goto('http://localhost:4597/', { waitUntil: 'domcontentloaded' });
await pEn.waitForTimeout(400);
check('英文环境首访自动跳 /en/', pEn.url().endsWith('/en/'), pEn.url());
const storedEn = await pEn.evaluate(() => localStorage.getItem('site-lang'));
check('首次检测已写入记忆', storedEn === 'en', String(storedEn));
await pEn.goto('http://localhost:4597/writing/', { waitUntil: 'domcontentloaded' });
await pEn.waitForTimeout(400);
check('记忆后访问中文页不再跳', pEn.url().endsWith('/writing/'), pEn.url());
await ctxEn.close();

const ctxEn2 = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 900 } });
const pEn2 = await ctxEn2.newPage();
await pEn2.goto('http://localhost:4597/writing/home/', { waitUntil: 'domcontentloaded' });
await pEn2.waitForTimeout(400);
check('英文环境深链跳 /en/writing/home/', pEn2.url().endsWith('/en/writing/home/'), pEn2.url());
await ctxEn2.close();

const ctxZh = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1440, height: 900 } });
const pZh = await ctxZh.newPage();
await pZh.goto('http://localhost:4597/', { waitUntil: 'domcontentloaded' });
await pZh.waitForTimeout(400);
check('中文环境停留中文首页', !pZh.url().includes('/en/'), pZh.url());
await pZh.evaluate(() => document.querySelector('.menu-toggle').click());
await pZh.waitForTimeout(600);
await pZh.evaluate(() => document.querySelector('.menu-lang').click());
await pZh.waitForTimeout(600);
check('手动切换到达英文页', pZh.url().includes('/en/'), pZh.url());
const storedZh = await pZh.evaluate(() => localStorage.getItem('site-lang'));
check('手动选择已记忆 en', storedZh === 'en', String(storedZh));
await ctxZh.close();

// 截图供过目
await pg.goto('http://localhost:4597/en/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1200);
await pg.screenshot({ path: 'shot-i18n-home-en.png' });
await pg.goto('http://localhost:4597/en/photos/01/', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1200);
await pg.screenshot({ path: 'shot-i18n-photo-en.png' });
await pg.evaluate(() => document.querySelector('.menu-toggle').click());
await pg.waitForTimeout(900);
await pg.screenshot({ path: 'shot-i18n-menu-en.png' });

// 手机端英文首页
const m = await browser.newPage({ viewport: { width: 375, height: 720 } });
m.on('pageerror', e => errors.push('mobile: ' + e.message));
await m.goto('http://localhost:4597/en/', { waitUntil: 'networkidle' });
await m.waitForTimeout(1000);
const mOverflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
check('手机英文首页无横向溢出', !mOverflow);
await m.screenshot({ path: 'shot-i18n-home-en-mobile.png' });

check('JS 无报错', errors.length === 0, errors.join(' ; '));
await browser.close();
server.close();
process.exit(fail ? 1 : 0);
