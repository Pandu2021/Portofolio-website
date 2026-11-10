/**
 * @file layout.mjs
 * Cross-app keyboard and responsive checks on /, /id/, /react/, /angular/, /vue/:
 *  - no sideways scrolling at 375 px (phone) and 768 px (tablet);
 *  - Tab through the first focusable elements: every focused element shows a
 *    visible focus indicator and is the top-most element at its own position
 *    (i.e. not hidden behind the sticky header or anything else).
 */
import { horizontalOverflow, openPage, screenshot, sleep } from '../harness.mjs';

const PAGES = [
  ['portfolio-en', ''],
  ['portfolio-id', 'id/'],
  ['react', 'react/'],
  ['angular', 'angular/'],
  ['vue', 'vue/'],
];
const VIEWPORTS = [
  { name: '375', width: 375, height: 812, mobile: true },
  { name: '768', width: 768, height: 1024, mobile: true },
];
/** How many Tab stops to inspect per page. */
const TAB_STOPS = 14;

/** Describes the focused element for reports, e.g. `a.nav-link "Orders"`. */
function describeFocused(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return '(body)';
    const text = (el.getAttribute('aria-label') ?? el.textContent ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 30);
    return `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''} "${text}"`;
  });
}

/** Whether the focused element has a visible focus style and is not covered. */
function inspectFocus(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body)
      return { visible: false, covered: false, indicator: false, coveredBy: '' };
    const style = getComputedStyle(el);
    const indicator =
      (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
      style.boxShadow !== 'none';
    const rect = el.getBoundingClientRect();
    const visible =
      rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    const x = Math.min(Math.max(rect.left + rect.width / 2, 0), window.innerWidth - 1);
    const y = Math.min(
      Math.max(rect.top + Math.min(rect.height / 2, 12), 0),
      window.innerHeight - 1,
    );
    const top = document.elementFromPoint(x, y);
    const covered = !(top && (top === el || el.contains(top) || top.contains(el)));
    const coveredBy =
      covered && top ? `${top.tagName.toLowerCase()}.${String(top.className).split(' ')[0]}` : '';
    return { visible, covered, indicator, coveredBy };
  });
}

/**
 * @param {{ browser: import('puppeteer-core').Browser, results: import('../harness.mjs').Results, base: string }} context
 */
export async function run({ browser, results, base }) {
  for (const [name, path] of PAGES) {
    // Responsive: no sideways scroll on phone and tablet widths.
    for (const viewport of VIEWPORTS) {
      const view = await openPage(browser, base + path, viewport);
      const overflow = await horizontalOverflow(view.page);
      results.check(
        overflow <= 0,
        `${name} @${viewport.name}px has no horizontal scroll`,
        `overflow=${overflow}px`,
      );
      await screenshot(view.page, `layout-${name}-${viewport.name}`);
      await view.close();
    }

    // Keyboard: focus is always visible and never covered.
    // Reduced motion turns off smooth scrolling, so positions are final when measured.
    const view = await openPage(browser, base + path, {
      width: 1280,
      height: 800,
      reducedMotion: true,
    });
    const problems = [];
    for (let stop = 1; stop <= TAB_STOPS; stop++) {
      await view.page.keyboard.press('Tab');
      // Let style transitions (even the 0.01 ms reduced-motion ones) settle, as a person would see it.
      await sleep(60);
      // Focus left the page after the last element: the Tab order is complete.
      if (await view.page.evaluate(() => document.activeElement === document.body)) break;
      const state = await inspectFocus(view.page);
      if (!state.indicator || !state.visible || state.covered) {
        problems.push(
          `#${stop} ${await describeFocused(view.page)}: ${[
            !state.indicator && 'no focus indicator',
            !state.visible && 'off-screen',
            state.covered && `covered by ${state.coveredBy}`,
          ]
            .filter(Boolean)
            .join(', ')}`,
        );
      }
    }
    results.check(
      problems.length === 0,
      `${name}: first ${TAB_STOPS} Tab stops are visible and uncovered`,
      problems.join(' | '),
    );
    await view.close();
  }
}
