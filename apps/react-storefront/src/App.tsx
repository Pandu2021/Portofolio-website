/**
 * @file App.tsx
 * Root component: hash-based routing (works on GitHub Pages without rewrites).
 * Phase 1 scaffold — the storefront features are built in Phase 4.
 */
import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { HomePage } from './routes/HomePage';

/** Route table. Add new pages here (e.g. `cart`, `product/:id`). */
const router = createHashRouter([{ path: '/', element: <HomePage /> }]);

/** Mounts the router. */
export function App() {
  return <RouterProvider router={router} />;
}
