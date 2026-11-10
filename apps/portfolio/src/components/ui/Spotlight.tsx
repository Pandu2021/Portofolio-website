'use client';
/**
 * @file Spotlight.tsx
 * Soft light that follows the mouse over `.card--spotlight` cards.
 *
 * - One delegated `pointermove` listener for the whole page, throttled to one
 *   update per animation frame.
 * - Only the glow's `transform` changes (GPU-composited, no layout work).
 * - CSP-safe: the position is written with `style.setProperty` (CSSOM), never
 *   as an inline `style="…"` attribute in the HTML.
 * - Mouse/trackpad only, and off for visitors who prefer reduced motion
 *   (the glow then stays still in the corner on hover — see site.css).
 */
import { useEffect } from 'react';

/** Mount once per page; renders nothing. */
export function Spotlight() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduceMotion) return;

    let frame = 0;
    let pending: { card: HTMLElement; x: number; y: number } | null = null;

    const update = () => {
      frame = 0;
      if (!pending) return;
      const { card, x, y } = pending;
      pending = null;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--spot-x', `${Math.round(x - rect.left)}px`);
      card.style.setProperty('--spot-y', `${Math.round(y - rect.top)}px`);
    };

    const onPointerMove = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>('.card--spotlight');
      if (!card) return;
      pending = { card, x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(update);
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
