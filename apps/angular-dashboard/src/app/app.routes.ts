/**
 * @file app.routes.ts
 * Route table. Pages are lazy-loaded so each one ships in its own chunk.
 */
import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Admin dashboard demo — Angular',
    loadComponent: () => import('./pages/home-page').then((m) => m.HomePage),
  },
  { path: '**', redirectTo: '' },
];
