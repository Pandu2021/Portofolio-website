/**
 * @file fonts.ts
 * Self-hosted fonts through `next/font/local` (portfolio only).
 *
 * Why not the shared fonts.css here? next/font also:
 *  - preloads the font file (faster first paint of real text), and
 *  - generates a size-adjusted fallback font, so text does not jump when the
 *    web font arrives (prevents layout shift / CLS).
 * The files come from the @fontsource packages (OFL-licensed, no CDN).
 * Only the Latin subset is needed for English and Indonesian.
 */
import localFont from 'next/font/local';

export const jakarta = localFont({
  src: '../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-jakarta',
  adjustFontFallback: 'Arial',
});

export const jetbrainsMono = localFont({
  src: '../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  weight: '100 800',
  display: 'swap',
  variable: '--font-jetbrains',
  // Monospace text is small and secondary: don't compete with the main font.
  preload: false,
  adjustFontFallback: false,
});
