/**
 * @file app.config.ts
 * Application-wide providers (zoneless change detection is the default).
 *
 * - `withHashLocation()` keeps routes in the URL hash (#/orders), so deep
 *   links work on GitHub Pages without server-side rewrites.
 * - `withComponentInputBinding()` passes route params (e.g. `:id`) to
 *   components as signal inputs.
 */
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
  ],
};
