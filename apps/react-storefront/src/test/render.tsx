/**
 * @file render.tsx
 * Test helper: renders the whole app at a given route using an in-memory
 * router (same route table and providers as production).
 */
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppProviders } from '../App';
import { routes } from '../routes';

/**
 * Renders the app at `path` (e.g. `/cart`).
 * @returns Testing Library utilities plus the router for navigation checks.
 */
export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...utils, router };
}
