'use client';
/**
 * @file RevealObserver.tsx
 * Adds `.is-visible` to every `[data-reveal]` element when it scrolls into view,
 * which triggers the short fade-up transition and the CSS-only effects tied to
 * it (section accent line, staggered skill chips, "Live" pulse — see site.css).
 * Highlight numbers (`[data-count]`) also count up once when they appear.
 *
 * Progressive enhancement: elements are only hidden when `<html class="js">`
 * is set by the boot script, so content stays visible without JavaScript.
 * Visitors who prefer reduced motion see everything immediately and no
 * numbers move.
 */
import { useEffect } from 'react';
import { COUNT_UP_MS, countUpText, parseCountValue } from '@/lib/motion';

/**
 * Counts a highlight value up from 0 inside `container`.
 *
 * The original text node is never changed: it is visually hidden while an
 * `aria-hidden` copy counts, then the copy is removed. Screen readers and
 * the final DOM therefore always contain the real value ("45+"), and the
 * animated digits use tabular numbers so the width does not jump.
 */
function countUp(container: Element): void {
  const value = container.querySelector<HTMLElement>('[data-count]');
  const count = parseCountValue(value?.textContent ?? '');
  if (!value || !count) return;

  const ticker = document.createElement('span');
  ticker.className = 'stat__ticker';
  ticker.setAttribute('aria-hidden', 'true');
  ticker.textContent = countUpText(count, 0);
  value.classList.add('is-counting'); // visually hidden, still read by screen readers
  value.after(ticker);

  const start = performance.now();
  const step = (now: number) => {
    const progress = (now - start) / COUNT_UP_MS;
    if (progress < 1) {
      ticker.textContent = countUpText(count, progress);
      requestAnimationFrame(step);
      return;
    }
    ticker.remove();
    value.classList.remove('is-counting');
    container.classList.add('is-counted'); // triggers the one-time shine (CSS)
  };
  requestAnimationFrame(step);
}

/** Mount once per page; renders nothing. */
export function RevealObserver() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            countUp(entry.target);
            observer.unobserve(entry.target); // animate only once
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
