'use client';
/**
 * @file RevealObserver.tsx
 * Adds `.is-visible` to every `[data-reveal]` element when it scrolls into view,
 * which triggers a short fade-up transition (see site.css).
 *
 * Progressive enhancement: elements are only hidden when `<html class="js">`
 * is set by the boot script, so content stays visible without JavaScript.
 * Visitors who prefer reduced motion see everything immediately.
 */
import { useEffect } from 'react';

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
