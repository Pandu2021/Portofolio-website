/**
 * @file portfolio.mjs
 * E2E checks for the Next.js portfolio: both languages, strict CSP, fonts,
 * theme (toggle + restore before paint), scroll reveal, certificate dialog,
 * mobile menu, skip link, CV content sections (skills without duplicates,
 * languages, course projects, coursework) and the 404 page.
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
        skipped,
      };
    });
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
      facts.courseCards === 9 && facts.courseTitles === 9 && facts.inProgress === 1,
      `${label} 9 course projects (1 in progress)`,
      `cards=${facts.courseCards} h4=${facts.courseTitles} inProgress=${facts.inProgress}`,
    );
    results.check(
      facts.verifyLinks === 8 && facts.safeLinks,
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

  // 6. Unknown URL shows the bilingual 404 page (the 404 status itself is expected).
  {
    const view = await openPage(browser, `${base}does-not-exist/`);
    const heading = await view.page.$eval('h1', (el) => el.textContent ?? '');
    const unexpected = view.errors.filter((error) => !error.includes('404'));
    results.check(/404/.test(heading) && unexpected.length === 0, '404 page renders', heading);
    await view.close();
  }
}
