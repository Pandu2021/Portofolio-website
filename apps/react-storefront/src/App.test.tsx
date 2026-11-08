/**
 * @file App.test.tsx
 * Smoke test: the app renders its home route through the hash router.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(cleanup);

describe('<App />', () => {
  it('renders the storefront heading', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /storefront demo/i })).toBeTruthy();
  });

  it('links back to the portfolio', async () => {
    render(<App />);
    const link = await screen.findByRole('link', { name: /back to portfolio/i });
    expect(link.getAttribute('href')).toBe('../');
  });
});
