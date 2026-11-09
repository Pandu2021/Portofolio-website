/**
 * @file App.tsx
 * Root component: app-wide providers + hash router.
 *
 * Hash routing (`#/cart`) means every URL loads the same index.html, so deep
 * links and refreshes work on GitHub Pages without server rewrites.
 */
import { useState, type ReactNode } from 'react';
import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AnnouncerProvider } from './a11y/Announcer';
import { CartProvider } from './cart/CartContext';
import { I18nProvider } from './i18n/I18nContext';
import { routes } from './routes';

/** Language, live-region announcer and cart, in dependency order. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AnnouncerProvider>
        <CartProvider>{children}</CartProvider>
      </AnnouncerProvider>
    </I18nProvider>
  );
}

/** The storefront application. */
export function App() {
  // Created once per mount (not at import time) so tests can use their own router.
  const [router] = useState(() => createHashRouter(routes));
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
