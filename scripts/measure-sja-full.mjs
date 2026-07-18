import { chromium } from 'playwright';
import fs from 'fs';

async function measureViewport(viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.goto('https://stevejobsarchive.com/', { waitUntil: 'networkidle' });

  const results = await page.evaluate(() => {
    const data = {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      elements: []
    };

    const describe = (el, name) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        name,
        tag: el.tagName,
        className: el.className?.slice(0, 100) || '',
        text: el.innerText ? el.innerText.slice(0, 120).replace(/\s+/g, ' ') : null,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y + window.scrollY),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        style: {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          color: style.color,
          backgroundColor: style.backgroundColor,
          padding: style.padding,
          margin: style.margin,
          textTransform: style.textTransform,
          borderRadius: style.borderRadius,
          display: style.display,
          position: style.position,
          gridTemplateColumns: style.gridTemplateColumns,
          gap: style.gap,
          maxWidth: style.maxWidth
        }
      };
    };

    // 1. Header
    const menuBtn = document.querySelector('button');
    if (menuBtn) data.elements.push(describe(menuBtn, 'menu-button'));

    // 2. Hero section
    const h1 = document.querySelector('h1');
    if (h1) {
      data.elements.push(describe(h1, 'hero-h1'));
      const heroWrapper = h1.closest('div[class*="css"]') || h1.parentElement;
      data.elements.push(describe(heroWrapper, 'hero-wrapper'));

      // find the link in the hero wrapper
      const heroLink = heroWrapper?.querySelector('a');
      if (heroLink) data.elements.push(describe(heroLink, 'hero-cta'));
    }

    // 3. Separators
    document.querySelectorAll('hr').forEach((sep, i) => data.elements.push(describe(sep, `separator-${i}`)));

    // 4. Each content block
    // SJA structure: each MediaSplit module has a wrapper with left text and right media
    // Find all h2s, then their closest ancestor that also contains a figure or img
    const h2s = Array.from(document.querySelectorAll('h2'));
    h2s.forEach((h2, i) => {
      // find module wrapper: go up until we find a container that includes figure/img
      let module = h2.parentElement;
      while (module && module !== document.body) {
        if (module.querySelector('figure') || module.querySelector('video') || module.querySelector('img')) {
          break;
        }
        module = module.parentElement;
      }
      if (module === document.body) module = h2.parentElement;

      data.elements.push(describe(module, `module-${i}-wrapper`));

      // get all direct text nodes or child elements with roles
      const allChildren = Array.from(module.querySelectorAll('*'));

      // eyebrow: small uppercase text above h2
      const eyebrow = allChildren.find(e => {
        const s = getComputedStyle(e);
        return e.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING &&
               e.tagName === 'P' &&
               s.textTransform === 'uppercase';
      });
      if (eyebrow) data.elements.push(describe(eyebrow, `module-${i}-eyebrow`));

      data.elements.push(describe(h2, `module-${i}-title`));

      // subtitle: paragraph after h2, same font size as title or larger
      const subtitle = allChildren.find(e => {
        const s = getComputedStyle(e);
        return e.tagName === 'P' &&
               (e.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_PRECEDING) &&
               parseFloat(s.fontSize) >= 14;
      });
      if (subtitle) data.elements.push(describe(subtitle, `module-${i}-subtitle`));

      // CTA: first link in the module
      const cta = module.querySelector('a');
      if (cta) data.elements.push(describe(cta, `module-${i}-cta`));

      // Media
      const figure = module.querySelector('figure');
      const img = module.querySelector('img');
      const video = module.querySelector('video');
      const media = figure || video || img;
      if (media) data.elements.push(describe(media, `module-${i}-media`));

      // Play button if exists
      const playBtn = module.querySelector('button[aria-label*="Play"], button:has(svg)');
      if (playBtn) data.elements.push(describe(playBtn, `module-${i}-play-button`));
    });

    // 5. Footer / Newsletter
    const footer = document.querySelector('footer');
    if (footer) data.elements.push(describe(footer, 'footer'));
    const footerText = Array.from(document.querySelectorAll('p, span, div')).find(e =>
      e.innerText?.includes('Subscribe for updates') && !e.innerText.includes('Skip to content')
    );
    if (footerText) data.elements.push(describe(footerText, 'newsletter-text'));
    const subscribeBtn = Array.from(document.querySelectorAll('button')).find(e => e.innerText?.includes('Sign up'));
    if (subscribeBtn) data.elements.push(describe(subscribeBtn, 'newsletter-button'));

    return data;
  });

  await browser.close();
  return results;
}

async function main() {
  const desktop = await measureViewport({ width: 1440, height: 900 });
  const mobile = await measureViewport({ width: 375, height: 812 });
  const output = { desktop, mobile };
  fs.writeFileSync('sja-full-measurements.json', JSON.stringify(output, null, 2));
  console.log('Desktop measured', desktop.elements.length, 'elements');
  console.log('Mobile measured', mobile.elements.length, 'elements');
}

main().catch(console.error);
