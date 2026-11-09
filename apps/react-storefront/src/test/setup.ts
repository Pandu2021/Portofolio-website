/**
 * @file setup.ts
 * Runs before every test file: clean DOM, storage and document state, so
 * tests never depend on each other.
 */
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.lang = 'en';
});

afterEach(() => {
  cleanup();
});
