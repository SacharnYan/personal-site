import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const port = 4608;
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain',
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    let file = path.join(root, pathname);
    if (pathname.endsWith('/') || (existsSync(file) && statSync(file).isDirectory())) file = path.join(file, 'index.html');
    if (!existsSync(file) && existsSync(file + '.html')) file += '.html';
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((resolve) => server.listen(port, resolve));
const browser = await chromium.launch();
let failures = 0;
const errors = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ` | ${detail}` : ''}`);
  if (!ok) failures++;
};
const tidy = (value) => (value || '').replace(/\s+/g, ' ').trim();

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  desktop.on('pageerror', (error) => errors.push(`desktop: ${error.message}`));
  await desktop.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await desktop.waitForTimeout(250);

  const home = await desktop.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent,
    h1Count: document.querySelectorAll('h1').length,
    mainNav: [...document.querySelectorAll('.primary-nav-link')].map((link) => ({
      text: link.textContent,
      display: getComputedStyle(link).display,
      rect: link.getBoundingClientRect().toJSON(),
    })),
    practiceCount: document.querySelectorAll('.practice-item').length,
    projectCount: document.querySelectorAll('.project-story').length,
    collectionCount: document.querySelectorAll('.collection-item').length,
    videos: document.querySelectorAll('video').length,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    og: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
  }));

  check('桌面首屏一句话说明价值', tidy(home.h1) === '把复杂的问题， 做成清晰、可用的产品。', tidy(home.h1));
  check('首页只有一个 H1', home.h1Count === 1, `count=${home.h1Count}`);
  check('桌面主导航直接可见', home.mainNav.length === 3 && home.mainNav.every((item) => item.display !== 'none'), home.mainNav.map((item) => item.text).join(','));
  check('三项工作方法完整', home.practiceCount === 3, `count=${home.practiceCount}`);
  check('两个精选项目完整', home.projectCount === 2, `count=${home.projectCount}`);
  check('五个持续记录入口完整', home.collectionCount === 5, `count=${home.collectionCount}`);
  check('首页不嵌入视频', home.videos === 0, `count=${home.videos}`);
  check('桌面无横向溢出', !home.overflow);
  check('首页标题与描述已更新', home.title.includes('解决方案设计师') && home.description.includes('可验收'), `${home.title} | ${home.description}`);
  check('canonical 不含查询参数', home.canonical === 'https://sacharn.site/', home.canonical);
  check('分享卡更新为 og.png', home.og === 'https://sacharn.site/og.png', home.og);

  await desktop.locator('.menu-toggle').click();
  await desktop.waitForTimeout(100);
  const opened = await desktop.evaluate(() => ({
    expanded: document.querySelector('.menu-toggle')?.getAttribute('aria-expanded'),
    hidden: document.querySelector('.menu-overlay')?.hidden,
    focused: document.activeElement?.className,
  }));
  check('菜单打开状态可访问', opened.expanded === 'true' && opened.hidden === false && String(opened.focused).includes('menu-close'), JSON.stringify(opened));
  await desktop.keyboard.press('Escape');
  await desktop.waitForTimeout(520);
  const closed = await desktop.evaluate(() => ({
    expanded: document.querySelector('.menu-toggle')?.getAttribute('aria-expanded'),
    hidden: document.querySelector('.menu-overlay')?.hidden,
    focus: document.activeElement?.className,
  }));
  check('Escape 关闭并恢复焦点', closed.expanded === 'false' && closed.hidden === true && String(closed.focus).includes('menu-toggle'), JSON.stringify(closed));

  await desktop.screenshot({ path: 'shot-overhaul-home-desktop.png' });

  const detailCases = [
    ['/projects/snow/', '/projects/snow/card.jpg'],
    ['/projects/floral/', '/cards/projects-card.jpg'],
    ['/photos/01/', '/photos/photo-01.jpg'],
    ['/writing/home/', '/cards/writing-home.jpg'],
  ];
  for (const [route, expected] of detailCases) {
    await desktop.goto(`http://localhost:${port}${route}`, { waitUntil: 'domcontentloaded' });
    const meta = await desktop.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      og: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      tw: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
    }));
    check(`详情分享图 ${route}`, meta.og?.endsWith(expected) && meta.tw === meta.og && !meta.og.endsWith('/og.png'), meta.og);
    check(`详情标题描述 ${route}`, Boolean(meta.title && meta.description), `${meta.title} | ${meta.description}`);
  }

  await desktop.goto(`http://localhost:${port}/writing/dragon/`, { waitUntil: 'domcontentloaded' });
  const noImageMeta = await desktop.evaluate(() => ({
    og: document.querySelector('meta[property="og:image"]'),
    tw: document.querySelector('meta[name="twitter:image"]'),
    card: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
  }));
  check('无封面文章不继承站点分享图', !noImageMeta.og && !noImageMeta.tw && noImageMeta.card === 'summary', noImageMeta.card);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on('pageerror', (error) => errors.push(`mobile: ${error.message}`));
  await mobile.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(250);
  const mobileHome = await mobile.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    h1Size: getComputedStyle(document.querySelector('.hero-title')).fontSize,
    desktopNav: getComputedStyle(document.querySelector('.primary-nav')).display,
    targets: [...document.querySelectorAll('.site-header a, .site-header button')].map((el) => {
      const r = el.getBoundingClientRect();
      return { label: el.textContent.trim() || el.getAttribute('aria-label'), width: r.width, height: r.height };
    }).filter((target) => target.width > 0 && target.height > 0),
  }));
  check('手机首页无横向溢出', !mobileHome.overflow);
  check('手机隐藏桌面导航', mobileHome.desktopNav === 'none', mobileHome.desktopNav);
  check('手机标题可读', Number.parseFloat(mobileHome.h1Size) >= 40, mobileHome.h1Size);
  check('手机页头触控尺寸充足', mobileHome.targets.every((target) => target.width >= 44 && target.height >= 44), JSON.stringify(mobileHome.targets));
  await mobile.screenshot({ path: 'shot-overhaul-home-mobile.png' });

  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const about = await reduced.newPage();
  about.on('pageerror', (error) => errors.push(`reduced: ${error.message}`));
  await about.goto(`http://localhost:${port}/about/`, { waitUntil: 'networkidle' });
  const aboutState = await about.evaluate(() => ({
    h1Count: document.querySelectorAll('h1').length,
    title: document.querySelector('.profile-hero h1')?.textContent,
    capabilityCount: document.querySelectorAll('.capability-grid > li').length,
    listDisplay: getComputedStyle(document.querySelector('.journey-accessible')).position,
    listHeight: document.querySelector('.journey-accessible')?.getBoundingClientRect().height,
    canvasDisplay: getComputedStyle(document.querySelector('.journey-sticky')).display,
  }));
  check('About 职业信息完整', aboutState.h1Count === 1 && aboutState.capabilityCount === 3 && tidy(aboutState.title).includes('业务、产品与技术'), JSON.stringify(aboutState));
  check('减少动态时显示可读时间线', aboutState.listDisplay === 'static' && aboutState.listHeight > 500 && aboutState.canvasDisplay === 'none', JSON.stringify(aboutState));
  await reduced.close();

  check('页面运行无脚本错误', errors.length === 0, errors.join(' ; '));
} finally {
  await browser.close();
  server.close();
}

console.log(`\n== ${failures === 0 ? '全部通过' : `${failures} 项失败`} ==`);
process.exit(failures ? 1 : 0);
