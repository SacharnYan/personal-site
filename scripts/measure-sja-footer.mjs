import { chromium } from 'playwright';
import fs from 'fs';

async function inspectFooter() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://stevejobsarchive.com/', { waitUntil: 'networkidle' });

  const footer = await page.evaluate(() => {
    const body = document.body;
    const allDivs = Array.from(body.querySelectorAll('div'));
    const footer = allDivs.find(d => {
      const s = getComputedStyle(d);
      return s.display === 'grid' && d.innerText.includes('Subscribe');
    });

    if (!footer) return { error: 'No footer found', candidates: allDivs.slice(-10).map(d => d.innerText.slice(0,50)) };

    const walk = (el, depth = 0) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className?.slice(0, 40) || '',
        text: el.innerText ? el.innerText.slice(0, 80).replace(/\s+/g, ' ') : '',
        rect: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
        fontSize: s.fontSize,
        color: s.color,
        textTransform: s.textTransform,
        margin: s.margin,
        padding: s.padding,
        children: Array.from(el.children).slice(0, 8).map(c => walk(c, depth + 1))
      };
    };

    return {
      footer: walk(footer),
      style: {
        display: getComputedStyle(footer).display,
        gridTemplateColumns: getComputedStyle(footer).gridTemplateColumns,
        padding: getComputedStyle(footer).padding,
        margin: getComputedStyle(footer).margin,
        maxWidth: getComputedStyle(footer).maxWidth
      },
      html: footer.outerHTML.slice(0, 3000)
    };
  });

  fs.writeFileSync('sja-footer.json', JSON.stringify(footer, null, 2));
  await browser.close();
  console.log('Footer saved');
}

inspectFooter().catch(console.error);
