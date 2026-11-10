/**
 * @file portfolio.mjs
 * E2E checks for the Next.js portfolio: both languages, strict CSP, fonts,
 * theme (toggle + restore before paint), scroll reveal, certificate dialog,
 * mobile menu, skip link, CV content sections (skills without duplicates,
 * languages, course projects, coursework), motion (count-up, reduced motion,
 * spotlight, no endless loops), the footer and the 404 page.
 */
import { horizontalOverflow, openPage, screenshot, sleep } from '../harness.mjs';

/**
 * Scrolls through the whole page so every reveal animation triggers.
 * Stays at the bottom: IntersectionObserver callbacks are asynchronous, so
 * jumping back to the top right away could skip the last sections.
 */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
  });
  await sleep(1000);
}

/**
 * @param {{ browser: import('puppeteer-core').Browser, results: import('../harness.mjs').Results, base: string }} context
 */
export async function run({ browser, results, base }) {
  // 1. Both languages: language, CSP, fonts, hydration.
  for (const [path, lang] of [
    ['', 'en'],
    ['id/', 'id-ID'],
  ]) {
    const view = await openPage(browser, base + path);
    const { page } = view;
    const label = `/${path}`;
    results.check(
      (await page.evaluate(() => document.documentElement.lang)) === lang,
      `${label} has lang="${lang}"`,
    );
    results.check((await page.$$('h1')).length === 1, `${label} has exactly one H1`);
    const csp = await view.csp();
    results.check(csp.length === 0, `${label} no CSP violations`, csp.join(' | '));
    results.check(
      view.errors.length === 0,
      `${label} no console or HTTP errors`,
      view.errors.join(' | ').slice(0, 200),
    );
    results.check(
      await page.evaluate(async () => {
        await document.fonts.ready;
        // next/font gives the family a hashed name that still contains "Jakarta".
        return [...document.fonts].some(
          (font) => /jakarta/i.test(font.family) && font.status === 'loaded',
        );
      }),
      `${label} self-hosted font loaded`,
    );
    results.check(
      Boolean(await page.$('meta[http-equiv="Content-Security-Policy"]')),
      `${label} ships a Content-Security-Policy`,
    );
    await page.click('button[data-theme-choice]');
    results.check(
      (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light',
      `${label} theme toggle works (hydrated)`,
    );
    await view.close();
  }

  // 2. Stored theme applies before paint; reveal animations finish.
  {
    const view = await openPage(browser, base);
    const { page } = view;
    await page.evaluate(() => localStorage.setItem('portfolio-theme', 'dark'));
    await page.reload({ waitUntil: 'networkidle0' });
    results.check(
      (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark',
      'stored dark theme is restored on reload',
    );
    await screenshot(page, 'portfolio-desktop-dark');
    await scrollThrough(page);
    const hidden = await page.evaluate(
      () =>
        [...document.querySelectorAll('[data-reveal]')].filter(
          (el) => !el.classList.contains('is-visible'),
        ).length,
    );
    results.check(hidden === 0, 'every scroll-reveal element becomes visible', `hidden=${hidden}`);
    await view.close();
  }

  // 3. Certificate dialog: lazy image, Escape closes, focus returns.
  {
    const view = await openPage(browser, base);
    const { page } = view;
    results.check(
      (await page.$$('dialog img')).length === 0,
      'no certificate image is loaded before it is requested',
    );
    const button = (await page.$$('.cert-card__actions button'))[0];
    await button.evaluate((el) => el.scrollIntoView());
    // On a slow network the first click can land before React has hydrated
    // the button; retry like a person would.
    for (let attempt = 0; attempt < 12 && !(await page.$('dialog[open]')); attempt++) {
      await button.click();
      await sleep(500);
    }
    await page.waitForSelector('dialog[open] img');
    await page.waitForFunction(() => document.querySelector('dialog[open] img')?.complete);
    const width = await page.evaluate(
      () => document.querySelector('dialog[open] img').naturalWidth,
    );
    results.check(width > 0, 'certificate image loads inside the dialog', `naturalWidth=${width}`);
    await page.keyboard.press('Escape');
    results.check(!(await page.$('dialog[open]')), 'Escape closes the dialog');
    results.check(
      await page.evaluate(() => document.activeElement?.closest('.cert-card__actions') !== null),
      'focus returns to the "View certificate" button',
    );
    await view.close();
  }

  // 4. Mobile: menu, no sideways scroll; skip link is the first Tab stop.
  {
    const view = await openPage(browser, base, {
      width: 375,
      height: 812,
      mobile: true,
      scheme: 'dark',
    });
    const { page } = view;
    results.check((await horizontalOverflow(page)) <= 0, 'no horizontal scroll on mobile');
    await page.click('.site-nav__toggle');
    results.check(
      (await page.$eval('.site-nav__toggle', (b) => b.getAttribute('aria-expanded'))) === 'true',
      'mobile menu opens (aria-expanded)',
    );
    await screenshot(page, 'portfolio-mobile-menu');
    await page.keyboard.press('Escape');
    results.check(
      (await page.$eval('.site-nav__toggle', (b) => b.getAttribute('aria-expanded'))) === 'false',
      'Escape closes the mobile menu',
    );
    await view.close();
  }
  {
    const view = await openPage(browser, base);
    await view.page.keyboard.press('Tab');
    results.check(
      (await view.page.evaluate(() => document.activeElement?.className)) === 'skip-link',
      'first Tab focuses the skip link',
    );
    await view.close();
  }

  // 5. CV content in both languages: skills (no duplicates), languages, course
  //    projects, coursework, academic experience and a clean heading outline.
  for (const path of ['', 'id/']) {
    const view = await openPage(browser, base + path);
    const { page } = view;
    const label = `/${path}`;
    const facts = await page.evaluate(() => {
      const text = (selector) =>
        [...document.querySelectorAll(selector)].map((el) => el.textContent?.trim() ?? '');
      const skills = text('.skill-group .chip').map((chip) =>
        chip.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase(),
      );
      // Heading levels in document order; a jump such as h2 → h4 is an error.
      const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) =>
        Number(h.tagName[1]),
      );
      const skipped = levels.filter((level, i) => i > 0 && level > levels[i - 1] + 1).length;
      const verifyLinks = [...document.querySelectorAll('.course-card__links a')];
      return {
        groups: document.querySelectorAll('.skill-group').length,
        skills,
        aiChips: text('.skill-group:nth-child(5) .chip'),
        notes: document.querySelectorAll('.skill-group__note').length,
        languages: document.querySelectorAll('.languages__item').length,
        courseCards: document.querySelectorAll('.course-card').length,
        courseTitles: document.querySelectorAll('.course-card h4').length,
        inProgress: document.querySelectorAll('.course-card .status[data-status="in-progress"]')
          .length,
        verifyLinks: verifyLinks.length,
        safeLinks: verifyLinks.every(
          (a) => a.target === '_blank' && /noopener/.test(a.rel) && a.href.startsWith('https://'),
        ),
        coursework: document.querySelectorAll('.coursework__group').length,
        activities: document.querySelectorAll('.activity-list > li').length,
        headerDownload:
          document.querySelector('.site-header a[download]')?.getAttribute('href') ?? '',
        headerDownloadName:
          document.querySelector('.site-header a[download]')?.getAttribute('download') ?? '',
        skipped,
        labChips: text('.lab-card .chip').map((chip) =>
          chip.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase(),
        ),
        tagline: document.querySelector('.hero')?.textContent?.replace(/\s+/g, ' ') ?? '',
      };
    });
    const strayChips = facts.labChips.filter((chip) => !facts.skills.includes(chip));
    results.check(
      strayChips.length === 0 && facts.labChips.length > 0,
      `${label} every Tech Lab chip is a Skills keyword (no overlap)`,
      strayChips.join(', '),
    );
    const frameworks =
      path === ''
        ? 'React, Next.js, Angular, Vue and TypeScript'
        : 'React, Next.js, Angular, Vue dan TypeScript';
    results.check(
      facts.tagline.includes(frameworks),
      `${label} hero tagline names React, Next.js, Angular, Vue and TypeScript`,
    );
    results.check(facts.groups === 8, `${label} Skills has 8 groups`, `groups=${facts.groups}`);
    const duplicates = facts.skills.filter((skill, i) => facts.skills.indexOf(skill) !== i);
    results.check(
      duplicates.length === 0,
      `${label} no duplicate skill keywords`,
      duplicates.join(', '),
    );
    results.check(
      facts.aiChips.includes('Claude Code') && facts.notes === 2,
      `${label} AI-assisted development group with its review note`,
      facts.aiChips.join(', '),
    );
    results.check(facts.languages === 2, `${label} spoken languages listed`);
    results.check(
      facts.courseCards === 8 && facts.courseTitles === 8 && facts.inProgress === 1,
      `${label} 8 course projects (1 in progress)`,
      `cards=${facts.courseCards} h4=${facts.courseTitles} inProgress=${facts.inProgress}`,
    );
    results.check(
      facts.headerDownload.endsWith('/CV_Public.pdf') && facts.headerDownloadName.includes('CV'),
      `${label} header button downloads the CV`,
      `${facts.headerDownload} (${facts.headerDownloadName})`,
    );
    results.check(
      facts.verifyLinks === 7 && facts.safeLinks,
      `${label} course projects link to certificate verification (new tab, noopener)`,
      `links=${facts.verifyLinks}`,
    );
    results.check(
      facts.coursework === 3 && facts.activities === 3,
      `${label} coursework (3 areas) and academic experience (3 items)`,
    );
    results.check(
      facts.skipped === 0,
      `${label} heading levels never skip`,
      `skips=${facts.skipped}`,
    );
    await view.close();
  }

  // 6. Motion: count-up, reduced motion, spotlight, no endless loops, footer.
  //    A short viewport keeps the highlights below the fold, so the count-up
  //    starts only when the test scrolls them into view.
  for (const reducedMotion of [false, true]) {
    const mode = reducedMotion ? 'reduced motion' : 'motion';
    const view = await openPage(browser, base, { width: 1280, height: 420, reducedMotion });
    const { page } = view;
    const original = await page.$$eval('[data-count]', (els) => els.map((el) => el.textContent));
    // Record every number the animated copy shows, and what screen readers get meanwhile.
    await page.evaluate(() => {
      window.__ticks = [];
      new MutationObserver(() => {
        for (const ticker of document.querySelectorAll('.stat__ticker')) {
          const real = ticker.previousElementSibling;
          window.__ticks.push({
            text: ticker.textContent,
            hidden: ticker.getAttribute('aria-hidden') === 'true',
            realText: real?.textContent,
            realHidden: real?.classList.contains('is-counting'),
          });
        }
      }).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    await page.$eval('.highlights', (el) => el.scrollIntoView({ block: 'center' }));
    await sleep(1800);
    const after = await page.evaluate(() => ({
      final: [...document.querySelectorAll('[data-count]')].map((el) => el.textContent),
      tickersLeft: document.querySelectorAll('.stat__ticker').length,
      counted: document.querySelectorAll('.stat.is-counted').length,
      ticks: window.__ticks,
    }));
    results.check(
      JSON.stringify(after.final) === JSON.stringify(original) && after.tickersLeft === 0,
      `${mode}: highlight numbers end exactly on the original text`,
      after.final.join(' | '),
    );
    if (reducedMotion) {
      results.check(
        after.ticks.length === 0 && after.counted === 0,
        'reduced motion: numbers do not move (final value at once)',
        `ticks=${after.ticks.length}`,
      );
    } else {
      const values = new Set(after.ticks.map((tick) => tick.text));
      results.check(
        values.size > 4 && after.counted === original.length,
        'highlight numbers count up once when they scroll into view',
        `distinct frames=${values.size} counted=${after.counted}`,
      );
      results.check(
        after.ticks.every(
          (tick) => tick.hidden && tick.realHidden && original.includes(tick.realText ?? ''),
        ),
        'while counting, screen readers keep the real value (moving digits are aria-hidden)',
      );
      // Spotlight follows the mouse on a Tech Lab card (CSSOM, so no CSP violation).
      const card = await page.$('.lab-card');
      // `instant`: the page uses smooth scrolling, and the box must be measured at rest.
      await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await sleep(100);
      const box = await card.boundingBox();
      await page.mouse.move(box.x + 40, box.y + 30);
      await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2, { steps: 5 });
      await sleep(450);
      const spot = await card.evaluate((el) => ({
        x: el.style.getPropertyValue('--spot-x'),
        opacity: getComputedStyle(el, '::before').opacity,
      }));
      results.check(
        Number.parseInt(spot.x, 10) > 0 && spot.opacity === '1',
        'card spotlight follows the mouse',
        `--spot-x=${spot.x} opacity=${spot.opacity}`,
      );
      await screenshot(page, 'portfolio-spotlight');
    }
    // No animation may loop forever (WCAG 2.2.2), with or without reduced motion.
    const loops = await page.evaluate(() =>
      [...document.querySelectorAll('*')].flatMap((el) =>
        [null, '::before', '::after']
          .filter((pseudo) => getComputedStyle(el, pseudo).animationIterationCount === 'infinite')
          .map((pseudo) => `${el.tagName.toLowerCase()}.${el.className}${pseudo ?? ''}`),
      ),
    );
    results.check(loops.length === 0, `${mode}: no endless animation`, loops.join(', '));
    const csp = await view.csp();
    results.check(csp.length === 0, `${mode}: no CSP violations`, csp.join(' | '));
    results.check(
      view.errors.length === 0,
      `${mode}: no console or HTTP errors`,
      view.errors.join(' | '),
    );
    await view.close();
  }
  {
    const view = await openPage(browser, base);
    const footer = await view.page.evaluate(() => ({
      footerLink: document.querySelectorAll('.site-footer a[href="#top"]').length,
      floating: document.querySelectorAll('a.back-to-top[href="#top"]').length,
    }));
    results.check(
      footer.footerLink === 0 && footer.floating === 1,
      'footer has no "Back to top" text link; the floating ↑ button remains',
    );
    await view.close();
  }

  // 7. Footer centring, Contact without accent line, AI card border light, "Live" glow.
  for (const width of [1280, 375]) {
    const view = await openPage(browser, base, { width, height: 800, mobile: width < 500 });
    const footer = await view.page.evaluate(() => {
      const page = document.documentElement.clientWidth;
      const centre = (el) => {
        const r = el.getBoundingClientRect();
        return Math.round(r.left + r.width / 2 - page / 2);
      };
      const built = document.querySelector('.site-footer__built');
      const copyright = document.querySelector('.site-footer__inner > p');
      return {
        builtOffset: built ? centre(built) : null,
        builtAlign: built ? getComputedStyle(built).textAlign : '',
        copyrightOffset: copyright ? centre(copyright) : null,
      };
    });
    const centred =
      width >= 960
        ? Math.abs(footer.builtOffset ?? 99) <= 2
        : Math.abs(footer.builtOffset ?? 99) <= 2 &&
          Math.abs(footer.copyrightOffset ?? 99) <= 2 &&
          footer.builtAlign === 'center';
    results.check(
      centred,
      `footer "Built with …" is centred at ${width}px`,
      JSON.stringify(footer),
    );
    // At the very bottom, the floating ↑ button must not cover any footer text.
    await view.page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );
    await sleep(400);
    const covered = await view.page.evaluate(() => {
      const button = document.querySelector('.back-to-top')?.getBoundingClientRect();
      if (!button) return 'no button';
      return [...document.querySelectorAll('.site-footer p')]
        .map((p) => p.getBoundingClientRect())
        .some(
          (r) =>
            r.left < button.right &&
            r.right > button.left &&
            r.top < button.bottom &&
            r.bottom > button.top,
        )
        ? 'covered'
        : '';
    });
    results.check(
      covered === '',
      `floating ↑ button does not cover footer text at ${width}px`,
      covered,
    );
    if (width === 1280) {
      const contactLine = await view.page.$eval(
        '#contact-title',
        (h) => getComputedStyle(h, '::after').display,
      );
      results.check(contactLine === 'none', 'Contact title has no accent line', contactLine);
    }
    await view.close();
  }
  {
    const view = await openPage(browser, base, { width: 1280, height: 800 });
    const { page } = view;
    // AI-Assisted Development card: one turn of border light on reveal, then it stops.
    await page.$eval('.skill-group--accent', (el) =>
      el.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await sleep(400);
    const glow = await page.$eval('.skill-group--accent .border-glow', (el) => {
      const style = getComputedStyle(el, '::before');
      return { name: style.animationName, count: style.animationIterationCount };
    });
    await sleep(3200);
    const glowAfter = await page.$eval(
      '.skill-group--accent .border-glow',
      (el) => getComputedStyle(el, '::before').opacity,
    );
    results.check(
      glow.name === 'border-light' && glow.count === '1' && glowAfter === '0',
      'AI card border light runs once on reveal and stops',
      `${glow.name} x${glow.count}, opacity after=${glowAfter}`,
    );
    // The light layer covers the card's border box exactly (inset -1px over the 1px border),
    // and the accent card is as tall as a normal card in the same grid row.
    const ring = await page.$eval('.skill-group--accent .border-glow', (el) => {
      const card = el.parentElement.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      return {
        dx: Math.round(box.width - card.width),
        dy: Math.round(box.height - card.height),
        left: Math.round(box.left - card.left),
        top: Math.round(box.top - card.top),
      };
    });
    results.check(
      Object.values(ring).every((delta) => Math.abs(delta) <= 1),
      'AI card border light sits exactly on the card edge (card size unchanged)',
      JSON.stringify(ring),
    );

    // "Live" glow: clearly visible (opacity > 0.3) for at least ~0.6 s per pulse.
    await page.$eval('.lab-card', (el) =>
      el.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    const samples = [];
    for (let i = 0; i < 20; i++) {
      samples.push(
        await page.$eval('.status[data-status="live"]', (el) =>
          Number(getComputedStyle(el, '::after').opacity),
        ),
      );
      await sleep(100);
    }
    let longest = 0;
    let run = 0;
    for (const value of samples) {
      run = value > 0.3 ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    results.check(
      longest >= 6,
      '"Live" glow is clearly visible (opacity > 0.3 for ≥ 0.6 s)',
      `longest=${longest * 100} ms, peak=${Math.max(...samples).toFixed(2)}`,
    );
    // Hover replays the glow on its own layer.
    const card = await page.$('.lab-card');
    const box = await card.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(200);
    const replay = await page.$eval(
      '.lab-card .status__glow',
      (el) => getComputedStyle(el).animationName,
    );
    results.check(replay === 'live-glow', '"Live" glow replays on hover', replay);

    // Hero "Open to roles" dot: same glow, clearly visible while the pill is hovered.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(200);
    const pill = await page.$('.hero .pill');
    const pillBox = await pill.boundingBox();
    await page.mouse.move(pillBox.x + pillBox.width / 2, pillBox.y + pillBox.height / 2);
    const dotSamples = [];
    for (let i = 0; i < 16; i++) {
      dotSamples.push(
        await page.$eval('.hero .pill__dot', (el) =>
          Number(getComputedStyle(el, '::before').opacity),
        ),
      );
      await sleep(100);
    }
    let dotLongest = 0;
    let dotRun = 0;
    for (const value of dotSamples) {
      dotRun = value > 0.3 ? dotRun + 1 : 0;
      dotLongest = Math.max(dotLongest, dotRun);
    }
    const dotLoad = await page.$eval('.hero .pill__dot', (el) => {
      const style = getComputedStyle(el, '::after');
      return `${style.animationName} x${style.animationIterationCount}`;
    });
    results.check(
      dotLongest >= 6 && dotLoad === 'live-glow x3',
      'hero "open to roles" dot glows like "Live" (3 pulses on load, visible on hover)',
      `${dotLoad}, longest=${dotLongest * 100} ms`,
    );
    const csp = await view.csp();
    results.check(
      csp.length === 0,
      'border light and Live glow: no CSP violations',
      csp.join(' | '),
    );
    await view.close();
  }

  // 8. Unknown URL shows the bilingual 404 page (the 404 status itself is expected).
  {
    const view = await openPage(browser, `${base}does-not-exist/`);
    const heading = await view.page.$eval('h1', (el) => el.textContent ?? '');
    const unexpected = view.errors.filter((error) => !error.includes('404'));
    results.check(/404/.test(heading) && unexpected.length === 0, '404 page renders', heading);
    await view.close();
  }
}
