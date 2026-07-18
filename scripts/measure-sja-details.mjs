import { chromium } from 'playwright';
import fs from 'fs';

async function inspectDetails() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://stevejobsarchive.com/', { waitUntil: 'networkidle' });

  const details = await page.evaluate(() => {
    const data = {};

    // Eyebrow details
    const firstModule = document.querySelectorAll('h2')[0]?.closest('div[class*="css"]');
    const eyebrow = firstModule?.querySelector('p');
    if (eyebrow) {
      const s = getComputedStyle(eyebrow);
      const rect = eyebrow.getBoundingClientRect();
      data.eyebrow = {
        text: eyebrow.innerText,
        rect: { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height },
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        textTransform: s.textTransform,
        margin: s.margin,
        padding: s.padding
      };
    }

    // CTA hover state (we can't measure hover here, just base)
    const cta = firstModule?.querySelector('a');
    if (cta) {
      const s = getComputedStyle(cta);
      data.cta = {
        text: cta.innerText,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: s.color,
        backgroundColor: s.backgroundColor,
        borderRadius: s.borderRadius,
        padding: s.padding,
        textDecoration: s.textDecoration,
        transition: s.transition
      };
    }

    // Hero link/cta
    const hero = document.querySelector('h1')?.closest('div');
    const heroLink = hero?.querySelector('a');
    if (heroLink) {
      const s = getComputedStyle(heroLink);
      data.heroLink = {
        text: heroLink.innerText,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        color: s.color,
        textDecoration: s.textDecoration
      };
    }

    // Image aspect ratio
    const img = firstModule?.querySelector('img');
    if (img) {
      data.image = {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3),
        src: img.src.slice(0, 80)
      };
    }

    // Footer layout
    const footer = document.querySelector('footer');
    if (footer) {
      const s = getComputedStyle(footer);
      const rect = footer.getBoundingClientRect();
      data.footer = {
        rect: { x: rect.x, y: rect.y + window.scrollY, width: rect.width, height: rect.height },
        padding: s.padding,
        margin: s.margin,
        display: s.display,
        gridTemplateColumns: s.gridTemplateColumns
      };
    }

    // Newsletter text
    const nl = Array.from(document.querySelectorAll('p, span, div')).find(e =>
      e.innerText?.includes('Subscribe for updates') && !e.innerText.includes('Skip to content')
    );
    if (nl) {
      const s = getComputedStyle(nl);
      data.newsletterText = {
        text: nl.innerText,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        color: s.color
      };
    }

    return data;
  });

  fs.writeFileSync('sja-details.json', JSON.stringify(details, null, 2));
  await browser.close();
  console.log('Details saved');
}

inspectDetails().catch(console.error);
