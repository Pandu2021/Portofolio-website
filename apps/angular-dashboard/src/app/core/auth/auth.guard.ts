/**
 * @file auth.guard.ts
 * Route guards: protected pages need a demo session; the login page is only
 * for signed-out visitors.
 */
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/** Redirects to `/login?returnUrl=…` when not signed in. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isSignedIn()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Sends signed-in users away from the login page. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isSignedIn() ? inject(Router).createUrlTree(['/overview']) : true;
