/**
 * @file motion.test.ts
 * The count-up helpers: parsing of highlight values and the easing curve.
 */
import { getContent, locales } from '@portfolio/content';
import { describe, expect, it } from 'vitest';
import { countUpText, easeOutCubic, parseCountValue } from './motion';

describe('parseCountValue', () => {
  it.each([
    ['~95', { prefix: '~', value: 95, suffix: '' }],
    ['45+', { prefix: '', value: 45, suffix: '+' }],
    ['1', { prefix: '', value: 1, suffix: '' }],
    [' 10 ', { prefix: '', value: 10, suffix: '' }],
  ])('splits "%s"', (text, expected) => {
    expect(parseCountValue(text)).toEqual(expected);
  });

  it.each(['', 'many', '1.5', '2025–2026', '1,200'])(
    'returns null for "%s" (shown without animation)',
    (text) => {
      expect(parseCountValue(text)).toBeNull();
    },
  );

  it.each(locales)('every %s highlight value can be animated', (locale) => {
    for (const { value } of getContent(locale).highlights) {
      expect(parseCountValue(value), value).not.toBeNull();
    }
  });
});

describe('easeOutCubic', () => {
  it('starts at 0, ends at 1 and never overshoots', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });

  it('is monotonic and front-loaded (ease-out)', () => {
    const samples = Array.from({ length: 11 }, (_, i) => easeOutCubic(i / 10));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1] ?? 0);
    }
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('countUpText', () => {
  it('ends exactly on the original text', () => {
    for (const text of ['~95', '45+', '1', '10']) {
      const count = parseCountValue(text);
      expect(count).not.toBeNull();
      if (count) expect(countUpText(count, 1)).toBe(text);
    }
  });

  it('starts from zero and keeps prefix and suffix', () => {
    expect(countUpText({ prefix: '~', value: 95, suffix: '' }, 0)).toBe('~0');
    expect(countUpText({ prefix: '', value: 45, suffix: '+' }, 0)).toBe('0+');
  });
});
