/**
 * @file motion.ts
 * Pure helpers for the light page animations (no DOM access, unit-tested).
 * The DOM side lives in `components/ui/RevealObserver.tsx`.
 */

/** Duration of the highlight count-up animation. */
export const COUNT_UP_MS = 1200;

/** A highlight value split into its animated number and fixed decorations. */
export interface CountValue {
  /** Text before the number, e.g. "~" in "~95". */
  prefix: string;
  /** Final integer the animation counts up to. */
  value: number;
  /** Text after the number, e.g. "+" in "45+". */
  suffix: string;
}

/**
 * Splits a highlight value such as "~95" or "45+" into prefix, integer and suffix.
 * Returns `null` for anything that is not a single whole number (those values
 * are simply shown without animation).
 * @example parseCountValue('~95') // { prefix: '~', value: 95, suffix: '' }
 */
export function parseCountValue(text: string): CountValue | null {
  const match = /^(\D*?)(\d{1,6})(\D*)$/.exec(text.trim());
  if (!match) return null;
  const [, prefix = '', digits = '', suffix = ''] = match;
  return { prefix, value: Number(digits), suffix };
}

/**
 * Ease-out cubic: fast start, gentle stop. Input and output are clamped to 0…1.
 * @param progress - Elapsed time divided by the duration.
 */
export function easeOutCubic(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return 1 - (1 - t) ** 3;
}

/**
 * Text shown at one moment of the count-up. At progress 1 it equals the
 * original value exactly, so the final text never differs from the HTML.
 */
export function countUpText(count: CountValue, progress: number): string {
  return `${count.prefix}${Math.round(count.value * easeOutCubic(progress))}${count.suffix}`;
}
