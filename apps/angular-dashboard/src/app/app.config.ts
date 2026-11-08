/**
 * @file app.config.ts
 * Application-wide providers.
 *
 * `withHashLocation()` keeps routes in the URL hash (#/orders), so deep links
 * work on GitHub Pages without server-side rewrites.
 */
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes, withHashLocation())],
};
