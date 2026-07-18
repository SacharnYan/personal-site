import { chromium } from 'playwright';
import fs from 'fs';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://stevejobsarchive.com/', { waitUntil: 'networkidle' });

  const data = await page.evaluate(() => {
    const h2 = document.querySelector('h2');
    const module = h2.closest('div[class*="css"]');

    // Walk the module structure
    const walk = (el, depth = 0) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className?.slice(0, 40) || '',
        text: el.innerText ? el.innerText.slice(0, 60).replace(/\s+/g, ' ') : '',
        rect: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
        fontSize: s.fontSize,
        color: s.color,
        textTransform: s.textTransform,
        children: Array.from(el.children).slice(0, 6).map(c => walk(c, depth + 1))
      };
    };

    const structure = walk(module);

    // All images in first module
    const images = Array.from(module.querySelectorAll('img')).map(img => ({
      src: img.src.slice(0, 120),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.width,
      height: img.height
    }));

    // Footer structure
    const footer = document.querySelector('footer');
    const footerStructure = footer ? walk(footer) : null;

    return { structure, images, footerStructure };
  });

  fs.writeFileSync('sja-structure.json', JSON.stringify(data, null, 2));
  await browser.close();
  console.log('Structure saved');
}

inspect().catch(console.error);
