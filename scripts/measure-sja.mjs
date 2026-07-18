import { chromium } from 'playwright';
import fs from 'fs';

async function measure() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://stevejobsarchive.com/', { waitUntil: 'networkidle' });

  const results = await page.evaluate(() => {
    const data = { viewport: { width: window.innerWidth, height: window.innerHeight }, elements: [] };

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
          gap: style.gap
        }
      };
    };

    // 1. Page container padding by measuring body or first element
    const body = document.body;
    const mainWrapper = document.querySelector('main > div') || document.querySelector('body > div');

    // 2. Header
    const header = document.querySelector('header') || document.querySelector('nav');
    if (header) data.elements.push(describe(header, 'header'));
    const logo = document.querySelector('a[href="/"]');
    if (logo) data.elements.push(describe(logo, 'logo-link'));
    const menuBtn = document.querySelector('button');
    if (menuBtn) data.elements.push(describe(menuBtn, 'menu-button'));

    // 3. Hero - find the big text block before first separator
    const h1 = document.querySelector('h1');
    if (h1) data.elements.push(describe(h1, 'hero-h1'));
    const heroLink = h1?.parentElement?.querySelector('a');
    if (heroLink) data.elements.push(describe(heroLink, 'hero-link'));
    const heroSection = h1?.closest('div');
    if (heroSection) data.elements.push(describe(heroSection, 'hero-section'));

    // 4. Find all separators
    const separators = Array.from(document.querySelectorAll('hr, [role="separator"]'));
    separators.forEach((sep, i) => data.elements.push(describe(sep, `separator-${i}`)));

    // 5. Find all h2s as block titles
    const h2s = Array.from(document.querySelectorAll('h2'));
    h2s.forEach((h2, i) => {
      const wrapper = h2.closest('div[class*="css"]') || h2.parentElement?.parentElement;
      data.elements.push(describe(wrapper, `block-${i}-wrapper`));
      data.elements.push(describe(h2, `block-${i}-title`));

      // eyebrow is the p before h2 or small text above h2
      const parent = h2.parentElement;
      const siblings = Array.from(parent?.children || []);
      const h2Index = siblings.indexOf(h2);
      const eyebrow = siblings[h2Index - 1]?.tagName === 'P' ? siblings[h2Index - 1] : null;
      if (eyebrow) data.elements.push(describe(eyebrow, `block-${i}-eyebrow`));

      const subtitle = siblings[h2Index + 1]?.tagName === 'P' ? siblings[h2Index + 1] : null;
      if (subtitle) data.elements.push(describe(subtitle, `block-${i}-subtitle`));

      // CTA - first link in the same block wrapper or parent
      const block = wrapper || parent;
      const cta = block?.querySelector('a');
      if (cta) data.elements.push(describe(cta, `block-${i}-cta`));

      // Media - figure or img in the same block
      const media = block?.querySelector('figure') || block?.querySelector('img') || block?.querySelector('video');
      if (media) data.elements.push(describe(media, `block-${i}-media`));
    });

    // 6. Newsletter footer
    const footer = document.querySelector('footer') || document.querySelector('body > div:last-child');
    if (footer) data.elements.push(describe(footer, 'footer'));
    const footerText = Array.from(document.querySelectorAll('p, span, div')).find(e => e.innerText?.includes('Subscribe'));
    if (footerText) data.elements.push(describe(footerText, 'newsletter-text'));
    const subscribeBtn = Array.from(document.querySelectorAll('button')).find(e => e.innerText?.includes('Sign up'));
    if (subscribeBtn) data.elements.push(describe(subscribeBtn, 'newsletter-button'));

    return data;
  });

  fs.writeFileSync('sja-measurements.json', JSON.stringify(results, null, 2));
  await page.screenshot({ path: 'sja-playwright.png', fullPage: true });
  await browser.close();
  console.log('Measured', results.elements.length, 'elements');
}

measure().catch(console.error);
