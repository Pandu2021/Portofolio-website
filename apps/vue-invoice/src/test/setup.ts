/**
 * @file setup.ts
 * Runs before every test file: clean storage and document state, so tests
 * never depend on each other.
 */
import { beforeEach } from 'vitest';

// jsdom does not implement scrolling; the router's scrollBehavior calls it.
window.scrollTo = () => undefined;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.lang = 'en';
});
