/**
 * @file app.routes.ts
 * Route table. Every page is lazy-loaded (own chunk). The shell wraps all
 * routes; dashboard pages require the demo session (authGuard).
 * `data.titleKey` names the message used for the browser tab title.
 */
import type { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { Shell } from './features/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        data: { titleKey: 'loginTitle' },
        loadComponent: () => import('./features/login/login-page').then((m) => m.LoginPage),
      },
      {
        path: '',
        canActivate: [authGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          {
            path: 'overview',
            data: { titleKey: 'navOverview' },
            loadComponent: () =>
              import('./features/overview/overview-page').then((m) => m.OverviewPage),
          },
          {
            path: 'orders',
            data: { titleKey: 'navOrders' },
            loadComponent: () => import('./features/orders/orders-page').then((m) => m.OrdersPage),
          },
          {
            path: 'orders/:id',
            data: { titleKey: 'navOrders' },
            loadComponent: () =>
              import('./features/orders/order-detail-page').then((m) => m.OrderDetailPage),
          },
          {
            path: 'settings',
            data: { titleKey: 'navSettings' },
            loadComponent: () =>
              import('./features/settings/settings-page').then((m) => m.SettingsPage),
          },
        ],
      },
      {
        path: '**',
        data: { titleKey: 'notFoundTitle' },
        loadComponent: () =>
          import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
