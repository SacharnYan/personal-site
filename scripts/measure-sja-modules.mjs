import { chromium } from 'playwright';
import fs from 'fs';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://stevejobsarchive.com/', { waitUntil: 'networkidle' });

  const data = await page.evaluate(() => {
    const modules = [];
    const h2s = Array.from(document.querySelectorAll('h2'));

    h2s.forEach((h2, i) => {
      // Find module grid wrapper (parent with gridTemplateColumns)
      let gridWrapper = h2.closest('div[class*="css"]');
      while (gridWrapper && gridWrapper !== document.body) {
        const s = getComputedStyle(gridWrapper);
        if (s.display === 'grid' && s.gridTemplateColumns.includes('px')) break;
        gridWrapper = gridWrapper.parentElement;
      }

      const textWrapper = h2.closest('div[class*="css"]') || h2.parentElement;
      const eyebrow = textWrapper?.querySelector('div[class*="css"]') || null;
      const subtitle = h2.nextElementSibling;
      const cta = gridWrapper?.querySelector('a');
      const figure = gridWrapper?.querySelector('figure');
      const img = figure?.querySelector('img') || gridWrapper?.querySelector('img');
      const video = gridWrapper?.querySelector('video');

      const module = {
        index: i,
        gridWrapper: {
          display: getComputedStyle(gridWrapper).display,
          gridTemplateColumns: getComputedStyle(gridWrapper).gridTemplateColumns,
          maxWidth: getComputedStyle(gridWrapper).maxWidth
        },
        eyebrow: eyebrow ? describe(eyebrow) : null,
        title: describe(h2),
        subtitle: subtitle ? describe(subtitle) : null,
        cta: cta ? describe(cta) : null,
        media: {
          figure: figure ? describe(figure) : null,
          img: img ? {
            ...describe(img),
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3),
            src: img.src.slice(0, 120)
          } : null,
          video: video ? describe(video) : null
        }
      };
      modules.push(module);
    });

    // Footer
    const footer = document.querySelector('footer');
    const footerData = footer ? {
      rect: rect(footer),
      style: styles(footer),
      html: footer.outerHTML.slice(0, 2000)
    } : null;

    return { modules, footerData };

    function describe(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className?.slice(0, 40) || '',
        text: el.innerText ? el.innerText.slice(0, 80).replace(/\s+/g, ' ') : '',
        rect: rect(el),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        backgroundColor: s.backgroundColor,
        padding: s.padding,
        margin: s.margin,
        borderRadius: s.borderRadius,
        textTransform: s.textTransform,
        textDecoration: s.textDecoration
      };
    }

    function rect(el) {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y + window.scrollY),
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    }

    function styles(el) {
      const s = getComputedStyle(el);
      return {
        display: s.display,
        gridTemplateColumns: s.gridTemplateColumns,
        padding: s.padding,
        margin: s.margin,
        fontSize: s.fontSize,
        color: s.color
      };
    }
  });

  fs.writeFileSync('sja-modules.json', JSON.stringify(data, null, 2));
  await browser.close();
  console.log('Modules saved');
}

inspect().catch(console.error);
